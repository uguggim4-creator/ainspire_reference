"""작품 내 메타데이터 중복 제거 — 태그 조합 기준

사용법:
    python dedup.py                  # 미리보기 (이동 안 함)
    python dedup.py --apply          # 실제 이동
    python dedup.py --max 3          # 그룹당 최대 3장 유지 (기본 2)
"""
import json
import shutil
import sys
from collections import defaultdict
from pathlib import Path

REF = Path("reference")
DEDUP_DIR = REF / "_dedup"

# 중복 판정에 사용할 필드 (이 조합이 모두 같으면 "중복")
FINGERPRINT_FIELDS = [
    "angle", "shot_size", "people_count",
    "color_mood", "setting", "location_type", "lighting",
]
FINGERPRINT_ARRAY_FIELDS = ["mood"]

MAX_PER_GROUP = 2  # 같은 태그 조합에서 최대 유지 장수


def fingerprint(meta: dict) -> str:
    parts = []
    for f in FINGERPRINT_FIELDS:
        parts.append(f"{f}={meta.get(f, '?')}")
    for f in FINGERPRINT_ARRAY_FIELDS:
        vals = sorted(meta.get(f) or [])
        parts.append(f"{f}={','.join(vals)}")
    return "|".join(parts)


def main():
    apply = "--apply" in sys.argv
    max_per = MAX_PER_GROUP
    for i, arg in enumerate(sys.argv):
        if arg == "--max" and i + 1 < len(sys.argv):
            max_per = int(sys.argv[i + 1])

    print(f"모드: {'적용' if apply else '미리보기'} | 그룹당 최대: {max_per}장")
    print("=" * 70)

    total_images = 0
    total_dedup = 0

    for work_dir in sorted(REF.iterdir()):
        if not work_dir.is_dir() or work_dir.name.startswith("_"):
            continue

        index_path = work_dir / "_index.json"
        if not index_path.exists():
            continue

        with open(index_path, encoding="utf-8") as f:
            items = json.load(f)

        scenes = [m for m in items if m.get("is_scene") and not m.get("_excluded")]
        if not scenes:
            continue

        groups = defaultdict(list)
        for m in scenes:
            fp = fingerprint(m)
            groups[fp].append(m)

        to_remove = []
        for fp, members in groups.items():
            if len(members) <= max_per:
                continue
            members.sort(key=lambda m: m.get("reference_score", 0), reverse=True)
            to_remove.extend(members[max_per:])

        if not to_remove:
            continue

        total_images += len(scenes)
        total_dedup += len(to_remove)

        print(f"\n[{work_dir.name}] {len(scenes)}장 → {len(scenes) - len(to_remove)}장 ({len(to_remove)}장 제거)")

        for m in to_remove:
            fn = m.get("filename", "?")
            fp = fingerprint(m)
            print(f"  - {fn}  ({fp[:80]}...)")

            if apply:
                dest_dir = DEDUP_DIR / work_dir.name
                dest_dir.mkdir(parents=True, exist_ok=True)

                img_path = work_dir / fn
                json_path = img_path.with_suffix(".json")

                if img_path.exists():
                    shutil.move(str(img_path), str(dest_dir / fn))
                if json_path.exists():
                    shutil.move(str(json_path), str(dest_dir / json_path.name))

        if apply:
            remaining = [
                m for m in items
                if m.get("filename") not in {r["filename"] for r in to_remove}
            ]
            with open(index_path, "w", encoding="utf-8") as f:
                json.dump(remaining, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 70)
    print(f"총 중복: {total_dedup}장 / 전체 {total_images}장")
    if not apply and total_dedup > 0:
        print("→ 실제 적용하려면: python dedup.py --apply")


if __name__ == "__main__":
    main()
