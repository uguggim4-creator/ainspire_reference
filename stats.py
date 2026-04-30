"""라이브러리 분포 분석"""
import json
from pathlib import Path
from collections import Counter

REF = Path("reference")

works = []
all_meta = []
for index_file in sorted(REF.glob("*/_index.json")):
    with open(index_file, encoding="utf-8") as f:
        data = json.load(f)
    scenes = [m for m in data if not m.get("_excluded")]
    works.append((index_file.parent.name, len(data), len(scenes)))
    all_meta.extend(scenes)

print(f"=== 작품별 ({len(works)}개) ===")
print(f"{'작품':<30}  전체  씬")
for name, total, scenes in works:
    print(f"{name:<30}  {total:>4}  {scenes:>4}")

print(f"\n=== 전체 씬 이미지: {len(all_meta)}장 ===\n")


def dist(field, multi=False):
    c = Counter()
    for m in all_meta:
        v = m.get(field)
        if v is None:
            continue
        if multi and isinstance(v, list):
            for x in v:
                c[x] += 1
        else:
            c[v] += 1
    return c


for field in ["angle", "shot_size", "people_count", "color_mood", "saturation"]:
    c = dist(field)
    print(f"[{field}]")
    for k, v in c.most_common():
        bar = "█" * int(v / max(c.values()) * 30)
        print(f"  {k:<20} {v:>4}  {bar}")
    print()

for field in ["composition", "mood"]:
    c = dist(field, multi=True)
    print(f"[{field}] (다중)")
    for k, v in c.most_common():
        bar = "█" * int(v / max(c.values()) * 30)
        print(f"  {k:<20} {v:>4}  {bar}")
    print()

# reference_score 분포
scores = Counter(m.get("reference_score") for m in all_meta if m.get("reference_score"))
print("[reference_score]")
for s in sorted(scores.keys()):
    bar = "█" * int(scores[s] / max(scores.values()) * 30)
    print(f"  {s:>2}점 {scores[s]:>4}  {bar}")
