"""레퍼런스 라이브러리 검색"""
import json
from pathlib import Path

REF = Path("reference")


def load_all():
    items = []
    for idx in sorted(REF.glob("*/_index.json")):
        work = idx.parent.name
        with open(idx, encoding="utf-8") as f:
            for m in json.load(f):
                if m.get("_excluded"):
                    continue
                m["_work"] = work
                m["_path"] = str(idx.parent / m["filename"])
                items.append(m)
    return items


def score(m: dict, q: dict) -> int:
    s = 0
    # 다중 필드 (intersect 가산점)
    for field in ("mood", "composition"):
        wanted = set(q.get(field) or [])
        actual = set(m.get(field) or [])
        s += len(wanted & actual) * q.get(f"_{field}_w", 1)
    # 단일 필드 매칭
    for field, weight in [
        ("angle", 1), ("shot_size", 1), ("people_count", 2),
        ("color_mood", 1), ("saturation", 1), ("setting", 1),
        ("time_of_day", 1),
    ]:
        if q.get(field) and m.get(field) == q[field]:
            s += weight
    return s


def search(items, query: dict, top: int = 5, per_work_max: int = 2):
    scored = [(score(m, query), m) for m in items]
    scored = [(s, m) for s, m in scored if s > 0]
    scored.sort(key=lambda x: (-x[0], -x[1].get("reference_score", 0)))
    # 작품 다양성 강제
    out = []
    work_count = {}
    for s, m in scored:
        w = m["_work"]
        if work_count.get(w, 0) >= per_work_max:
            continue
        out.append((s, m))
        work_count[w] = work_count.get(w, 0) + 1
        if len(out) >= top:
            break
    return out


def show(results, label: str):
    print(f"\n{'='*70}\n[ {label} ]\n{'='*70}")
    for i, (s, m) in enumerate(results, 1):
        print(f"\n[{i}] score={s} | {m['_work']} / {m['filename']}")
        print(f"    angle={m.get('angle')} shot={m.get('shot_size')} "
              f"people={m.get('people_count')} mood={m.get('mood')}")
        print(f"    color={m.get('color_mood')} saturation={m.get('saturation')}")
        print(f"    \"{m.get('description','')[:130]}...\"")
        print(f"    → {m['_path']}")


if __name__ == "__main__":
    items = load_all()
    print(f"라이브러리: {len(items)}장")

    # 호프집 씬용 다중 쿼리

    q1 = {  # ① 마주 앉은 둘
        "people_count": "duo",
        "shot_size": "medium",
        "angle": "eye_level",
        "color_mood": "warm",
        "mood": ["melancholic", "tense", "ominous"],
        "_mood_w": 2,
    }

    q2 = {  # ② 혼자 잔 앞에
        "people_count": "solo",
        "shot_size": "close",
        "color_mood": "warm",
        "mood": ["melancholic", "ominous"],
        "_mood_w": 2,
    }

    q3 = {  # ③ 무리 속 고독, 와이드 바 분위기
        "shot_size": "wide",
        "people_count": "group",
        "color_mood": "warm",
        "mood": ["melancholic", "tense"],
        "_mood_w": 2,
    }

    q4 = {  # ④ 사색적 클로즈업
        "people_count": "solo",
        "shot_size": "close",
        "mood": ["melancholic"],
        "saturation": "muted",
        "_mood_w": 2,
    }

    show(search(items, q1, top=5), "① 마주 앉아 대화하는 두 사람 (warm + melancholic + duo medium)")
    show(search(items, q2, top=5), "② 혼자 잔 앞에 앉은 인물 (warm + close + solo)")
    show(search(items, q3, top=5), "③ 무리 속 고독 (wide + group + warm)")
    show(search(items, q4, top=5), "④ 사색적 클로즈업 (muted + solo + melancholic)")
