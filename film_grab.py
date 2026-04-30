"""Film Grab (film-grab.com) 이미지 다운로더

사용법:
    pip install requests beautifulsoup4

    python film_grab.py --index                     # A-Z 인덱스 빌드 (최초 1회)
    python film_grab.py --search "2001"             # 인덱스에서 검색
    python film_grab.py "2001 A Space Odyssey"      # 다운로드
    python film_grab.py "2001 A Space Odyssey" --analyze   # 다운로드 + Gemini 분석

출력:
    reference/{title}/ 폴더에 이미지 저장
    film_grab_index.json 에 인덱스 캐시
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

REFERENCE_DIR = Path(__file__).parent / "reference"
INDEX_FILE = Path(__file__).parent / "film_grab_index.json"
BASE_URL = "https://film-grab.com"
AZ_URL = f"{BASE_URL}/movies-a-z/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}
SLEEP_BETWEEN = 1.0  # 서버 부하 방지


def safe_dirname(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip()


# ──────────────────────────────────────────────
# 1. 인덱스 빌드 — A-Z 페이지 스크래핑
# ──────────────────────────────────────────────

def build_index() -> list[dict]:
    """film-grab.com/movies-a-z/ 에서 전체 영화 목록 추출"""
    print(f"인덱스 빌드: {AZ_URL}")
    r = requests.get(AZ_URL, headers=HEADERS, timeout=30)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    movies = []

    for a_tag in soup.select("div.entry-content a[href]"):
        href = a_tag.get("href", "")
        title = a_tag.get_text(strip=True)
        if not title or "film-grab.com" not in href:
            continue
        movies.append({"title": title, "url": href})

    # 중복 제거
    seen = set()
    unique = []
    for m in movies:
        if m["url"] not in seen:
            seen.add(m["url"])
            unique.append(m)

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)

    print(f"  → {len(unique)}편 인덱싱 완료 → {INDEX_FILE}")
    return unique


def load_index() -> list[dict]:
    if INDEX_FILE.exists():
        with open(INDEX_FILE, encoding="utf-8") as f:
            return json.load(f)
    return build_index()


def search_index(query: str, index: list[dict]) -> list[dict]:
    """퍼지 검색 — 쿼리 단어가 모두 포함된 제목 매칭"""
    words = query.lower().split()
    results = []
    for m in index:
        title_lower = m["title"].lower()
        if all(w in title_lower for w in words):
            results.append(m)
    return results


# ──────────────────────────────────────────────
# 2. 영화 페이지 → 이미지 URL 추출
# ──────────────────────────────────────────────

def extract_image_urls(page_url: str) -> list[str]:
    """영화 상세 페이지에서 원본 이미지 URL 추출"""
    print(f"  페이지 파싱: {page_url}")
    r = requests.get(page_url, headers=HEADERS, timeout=30)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    urls = []

    # BWG 갤러리 플러그인: .bwg_masonry_thumb_* 안의 <a href="원본">
    for a_tag in soup.select("div[class*='bwg_masonry_thumb'] a[href]"):
        href = a_tag.get("href", "")
        if href and ("/photo-gallery/" in href or href.endswith((".jpg", ".jpeg", ".png"))):
            urls.append(href)

    # 대체 패턴: .bwg-item a[href] 또는 직접 img src
    if not urls:
        for a_tag in soup.select("a[href*='photo-gallery']"):
            href = a_tag.get("href", "")
            if "/thumb/" not in href and href.endswith((".jpg", ".jpeg", ".png", ".webp")):
                urls.append(href)

    # 대체 패턴 2: data-src나 data-image 속성
    if not urls:
        for img in soup.select("img[data-src*='photo-gallery']"):
            src = img.get("data-src", "")
            if "/thumb/" not in src:
                urls.append(src)

    # 대체 패턴 3: 일반 갤러리 이미지
    if not urls:
        for img in soup.select("div.entry-content img"):
            src = img.get("src", "") or img.get("data-src", "")
            if src and src.endswith((".jpg", ".jpeg", ".png")):
                full_url = urljoin(page_url, src)
                urls.append(full_url)

    # ?bwg= 쿼리 파라미터 제거, 중복 제거
    cleaned = []
    seen = set()
    for url in urls:
        url = url.split("?")[0]
        if url not in seen:
            seen.add(url)
            cleaned.append(url)

    return cleaned


# ──────────────────────────────────────────────
# 3. 이미지 다운로드
# ──────────────────────────────────────────────

def download_images(urls: list[str], dest_dir: Path, prefix: str = "fg_") -> int:
    dest_dir.mkdir(parents=True, exist_ok=True)
    total_bytes = 0

    for i, url in enumerate(urls, 1):
        ext = Path(url.split("?")[0]).suffix or ".jpg"
        dest = dest_dir / f"{prefix}{i:03d}{ext}"

        if dest.exists():
            print(f"  [{i:03d}/{len(urls)}] {dest.name} — 이미 존재 (스킵)")
            continue

        try:
            r = requests.get(url, headers=HEADERS, timeout=30, stream=True)
            r.raise_for_status()
            dest.write_bytes(r.content)
            size = len(r.content)
            total_bytes += size
            print(f"  [{i:03d}/{len(urls)}] {dest.name} ({size // 1024} KB)")
            time.sleep(SLEEP_BETWEEN)
        except Exception as e:
            print(f"  [{i:03d}/{len(urls)}] FAIL: {e}")

    return total_bytes


# ──────────────────────────────────────────────
# 4. 메인
# ──────────────────────────────────────────────

def main():
    args = sys.argv[1:]

    if not args or "--help" in args:
        print(__doc__)
        return

    # 인덱스 빌드
    if "--index" in args:
        build_index()
        return

    index = load_index()

    # 검색
    if "--search" in args:
        idx = args.index("--search")
        query = args[idx + 1] if idx + 1 < len(args) else ""
        results = search_index(query, index)
        print(f"'{query}' 검색 결과 ({len(results)}건):")
        for m in results[:20]:
            print(f"  {m['title']}")
            print(f"    {m['url']}")
        return

    # 다운로드
    do_analyze = "--analyze" in args
    query = [a for a in args if not a.startswith("--")][0]

    results = search_index(query, index)
    if not results:
        sys.exit(f"'{query}' → 인덱스에서 찾을 수 없음. --index로 인덱스 재빌드 또는 --search로 검색해보세요.")

    movie = results[0]
    title = movie["title"]
    page_url = movie["url"]

    print(f"[1] 매칭: {title}")
    print(f"    URL: {page_url}")

    # 이미지 URL 추출
    print(f"[2] 이미지 URL 추출 중...")
    image_urls = extract_image_urls(page_url)
    print(f"  → {len(image_urls)}장 발견")

    if not image_urls:
        sys.exit("이미지를 찾을 수 없음 (페이지 구조 변경?)")

    # 다운로드
    folder = REFERENCE_DIR / safe_dirname(title)
    print(f"[3] 다운로드 → {folder}")
    total = download_images(image_urls, folder)
    print(f"\n완료: {len(image_urls)}장, 총 {total / 1024 / 1024:.1f} MB")
    print(f"저장 위치: {folder}")

    # 분석 (옵션)
    if do_analyze:
        print(f"\n[4] Gemini 분석 시작...")
        subprocess.run(
            [sys.executable, "analyze_images.py", str(folder)],
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )


if __name__ == "__main__":
    main()
