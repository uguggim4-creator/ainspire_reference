"""TMDB API로 특정 콘텐츠의 backdrop 이미지 일괄 다운로드"""
import os
import sys
import re
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("TMDB_API_KEY")
if not API_KEY:
    sys.exit("TMDB_API_KEY not set in .env")

BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p/original"
REFERENCE_DIR = Path(__file__).parent / "reference"


def safe_dirname(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip()


def search(query: str):
    r = requests.get(
        f"{BASE}/search/multi",
        params={"api_key": API_KEY, "query": query, "language": "ko-KR"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json().get("results", [])


def get_images(media_type: str, tmdb_id: int):
    r = requests.get(
        f"{BASE}/{media_type}/{tmdb_id}/images",
        params={"api_key": API_KEY, "include_image_language": "ko,en,null"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def download(url: str, dest: Path):
    r = requests.get(url, timeout=30, stream=True)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return len(r.content)


def main(query: str):
    # ID 직접 지정 모드: "tmdb:movie:489888" / "tmdb:tv:93405"
    m = re.match(r"^tmdb:(movie|tv):(\d+)$", query)
    if m:
        media_type = m.group(1)
        tmdb_id = int(m.group(2))
        meta = requests.get(
            f"{BASE}/{media_type}/{tmdb_id}",
            params={"api_key": API_KEY, "language": "ko-KR"}, timeout=15,
        ).json()
        title = meta.get("title") or meta.get("name") or f"{media_type}_{tmdb_id}"
        print(f"[1] ID 직접 지정: [{media_type}] {title} (id={tmdb_id})")
    else:
        # "Moonlight:movie" 같은 타입 강제 필터
        type_filter = None
        if ":" in query:
            query, suffix = query.rsplit(":", 1)
            if suffix in ("movie", "tv"):
                type_filter = suffix

        print(f"[1] '{query}' 검색 중... (type={type_filter or 'any'})")
        results = search(query)
        if not results:
            sys.exit("검색 결과 없음")

        allowed_types = (type_filter,) if type_filter else ("movie", "tv")
        candidates = [r for r in results if r.get("media_type") in allowed_types]
        candidates.sort(key=lambda r: r.get("popularity", 0), reverse=True)
        if not candidates:
            sys.exit(f"{allowed_types} 결과 없음")

        top = candidates[0]
        media_type = top["media_type"]
        tmdb_id = top["id"]
        title = top.get("title") or top.get("name")
        print(f"  → 매칭: [{media_type}] {title} (id={tmdb_id})")

    print(f"[2] backdrop 목록 조회...")
    images = get_images(media_type, tmdb_id)
    backdrops = images.get("backdrops", [])
    print(f"  → backdrop {len(backdrops)}개 발견")

    if not backdrops:
        sys.exit("backdrop 없음")

    folder = REFERENCE_DIR / safe_dirname(title)
    folder.mkdir(parents=True, exist_ok=True)
    print(f"[3] 다운로드 → {folder}")

    total_bytes = 0
    for i, bd in enumerate(backdrops, 1):
        file_path = bd["file_path"]
        url = f"{IMG_BASE}{file_path}"
        dest = folder / f"{i:02d}_{bd['width']}x{bd['height']}{Path(file_path).suffix}"
        try:
            size = download(url, dest)
            total_bytes += size
            print(f"  [{i:02d}/{len(backdrops)}] {dest.name} ({size//1024} KB)")
        except Exception as e:
            print(f"  [{i:02d}] FAIL: {e}")

    print(f"\n완료: {len(backdrops)}장, 총 {total_bytes/1024/1024:.1f} MB")
    print(f"저장 위치: {folder}")


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "오징어 게임"
    main(query)
