"""Film Grab 이미지를 기존 reference 폴더에 보강 (fg_ prefix)

사용법:
    python film_grab_batch.py              # 전체 실행
    python film_grab_batch.py --dry-run    # 미리보기만
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from film_grab import load_index, search_index, extract_image_urls, download_images

REFERENCE_DIR = Path("reference")
WORKERS = 4  # Film Grab 서버 부하 고려 (TMDB보다 보수적)

# 기존 폴더명 → Film Grab 검색어 매핑 (교차 매칭 검증 완료)
MAPPING = {
    "2001 스페이스 오디세이": "2001 A Space Odyssey",
    "그녀": "Her",
    "그랜드 부다페스트 호텔": "Grand Budapest Hotel",
    "기생충": "Parasite",
    "다크 나이트": "Dark Knight",
    "드라이브": "Drive",
    "드라이브 마이 카": "Drive My Car",
    "라라랜드": "La La Land",
    "라이트하우스": "Lighthouse",
    "로마": "Roma",
    "매드맥스_ 분노의 도로": "Mad Max Fury Road",
    "문라이트": "Moonlight",
    "버닝": "Burning",
    "블레이드 러너 2049": "Blade Runner 2049",
    "사랑도 통역이 되나요_": "Lost In Translation",
    "센과 치히로의 행방불명": "Spirited Away",
    "시네마 천국": "Cinema Paradiso",
    "아멜리에": "Amelie",
    "인셉션": "Inception",
    "조커": "Joker",
    "콜드 워": "Cold War",
    "트리 오브 라이프": "Tree of Life",
    "화양연화": "In The Mood For Love",
    "비포 선라이즈": "Before Sunrise",
    "이터널 선샤인": "Eternal Sunshine",
    "월터의 상상은 현실이 된다": "Secret Life of Walter Mitty",
    "패딩턴 2": "Paddington 2",
    "미드소마": "Midsommar",
    "문라이즈 킹덤": "Moonrise Kingdom",
    "콜 미 바이 유어 네임": "Call Me By Your Name",
    "레퀴엠": "Requiem For A Dream",
    "블랙 스완": "Black Swan",
    "베이비 드라이버": "Baby Driver",
    "와호장룡": "Crouching Tiger",
    "매트릭스": "Matrix",
    "레버넌트_ 죽음에서 돌아온 자": "Revenant",
    "아라비아의 로렌스": "Lawrence of Arabia",
    "인투 더 와일드": "Into the Wild",
    "반지의 제왕_ 반지 원정대": "Lord of the Rings",
    "인터스텔라": "Interstellar",
    "아바타": "Avatar",
    "엔터 더 보이드": "Enter the Void",
    "콜래트럴": "Collateral",
    "나이트 크롤러": "Nightcrawler",
    "네온 데몬": "Neon Demon",
    "택시 드라이버": "Taxi Driver",
    "너의 이름은.": "Your Name",
    "모노노케 히메": "Princess Mononoke",
    "아키라": "Akira",
    "파프리카": "Paprika",
    "시민 케인": "Citizen Kane",
    "씬 시티": "Sin City",
    "이다": "Ida",
    "시티 오브 갓": "City of God",
    "트레인스포팅": "Trainspotting",
    "파이트 클럽": "Fight Club",
    "샤이닝": "Shining",
    "배리 린든": "Barry Lyndon",
    "팬텀 스레드": "Phantom Thread",
    "컨택트": "Arrival",
    "엑스 마키나": "Ex Machina",
    "판의 미로_ 오필리아와 세개의 열쇠": "Pan's Labyrinth",
    "셰이프 오브 워터_ 사랑의 모양": "Shape of Water",
    "서스페리아": "Suspiria",
    "결혼 이야기": "Marriage Story",
    "올드보이": "Oldboy",
    "아가씨": "Handmaiden",
    "블레이드 러너": "Blade Runner",
    "영웅": "Hero",
    "홍등": "Raise the Red Lantern",
    "헤어질 결심": "Decision to Leave",
    "킬 빌_ 1부": "Kill Bill",
    "브레이킹 배드": "Breaking Bad",
    "스파이더맨_ 어크로스 더 유니버스": "Spider-Verse",
    "미스 리틀 선샤인": "Little Miss Sunshine",
    "쉰들러 리스트": "Schindler's List",
}


def process_one(folder_name: str, fg_query: str, index: list, dry_run: bool) -> tuple:
    """한 작품 처리: Film Grab 검색 → 다운로드 → 분석"""
    results = search_index(fg_query, index)
    if not results:
        return folder_name, "SKIP", "Film Grab에서 찾을 수 없음"

    movie = results[0]
    dest_dir = REFERENCE_DIR / folder_name

    if not dest_dir.exists():
        return folder_name, "SKIP", f"폴더 없음: {dest_dir}"

    try:
        image_urls = extract_image_urls(movie["url"])
    except Exception as e:
        return folder_name, "FAIL", f"페이지 파싱 오류: {e}"

    if not image_urls:
        return folder_name, "SKIP", "이미지 없음"

    if dry_run:
        return folder_name, "DRY", f"{len(image_urls)}장 발견 → {dest_dir.name}"

    total = download_images(image_urls, dest_dir, prefix="fg_")

    # 분석
    subprocess.run(
        [sys.executable, "analyze_images.py", str(dest_dir)],
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        capture_output=True,
    )

    return folder_name, "OK", f"+{len(image_urls)}장 ({total // 1024} KB)"


def main():
    dry_run = "--dry-run" in sys.argv
    index = load_index()

    # 실제 존재하는 폴더만 필터
    targets = {
        k: v for k, v in MAPPING.items()
        if (REFERENCE_DIR / k).exists()
    }

    print(f"Film Grab 보강: {len(targets)}편 {'(DRY RUN)' if dry_run else ''}")
    print(f"병렬: {WORKERS}개")
    print("=" * 70, flush=True)

    ok = fail = skip = 0

    with ProcessPoolExecutor(max_workers=WORKERS) as ex:
        futures = {
            ex.submit(process_one, folder, query, index, dry_run): folder
            for folder, query in targets.items()
        }
        for i, fut in enumerate(as_completed(futures), 1):
            name, status, msg = fut.result()
            print(f"[{i:02d}/{len(targets)}] [{status:>4}] {name}", flush=True)
            print(f"             {msg}", flush=True)
            if status == "OK":
                ok += 1
            elif status == "FAIL":
                fail += 1
            else:
                skip += 1

    print("=" * 70)
    print(f"완료: 성공 {ok} / 스킵 {skip} / 실패 {fail}")


if __name__ == "__main__":
    main()
