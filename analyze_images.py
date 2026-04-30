"""
Replicate (Gemini 2.5 Flash)로 이미지 메타데이터 분석 → JSON 저장

사용법:
    pip install replicate pillow python-dotenv pydantic
    .env에 REPLICATE_API_TOKEN 필요
    python analyze_images.py "reference/오징어 게임"          # 전체
    python analyze_images.py "reference/오징어 게임" 5         # 처음 5장만 (테스트)

출력:
    이미지 옆에 동일 이름 .json 저장
    is_scene=false 또는 is_keyart=true → reference/_excluded/{작품명}/ 으로 이동
    완료 후 reference/{작품명}/_index.json (통합 인덱스)
"""
import os
import sys
import json
import re
import time
from io import BytesIO
from pathlib import Path
from typing import Literal

from PIL import Image
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv
import replicate

load_dotenv()
TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not TOKEN:
    sys.exit("REPLICATE_API_TOKEN not set in .env")
os.environ["REPLICATE_API_TOKEN"] = TOKEN

# ===== 설정 =====
MODEL = "google/gemini-2.5-flash"
RESIZE_WIDTH = 1280
JPEG_QUALITY = 85
SLEEP_BETWEEN = 0.5      # Replicate는 RPM 제한 빡빡하지 않음
RETRY_ON_PARSE_FAIL = 1  # JSON 파싱 실패 시 재시도 횟수


# ===== 응답 스키마 =====
class ImageMeta(BaseModel):
    is_scene: bool
    is_keyart: bool
    reference_score: int = Field(ge=1, le=10)

    angle: Literal["eye_level", "low", "high", "overhead", "dutch"]
    shot_size: Literal["extreme_close", "close", "medium", "wide", "extreme_wide"]
    people_count: Literal["none", "solo", "duo", "group", "crowd"]
    composition: list[Literal[
        "centered", "rule_of_thirds", "symmetrical",
        "leading_lines", "negative_space", "frame_within_frame"
    ]]

    color_mood: Literal["warm", "cool", "neutral", "monochromatic", "teal_orange"]
    saturation: Literal["high", "medium", "muted"]
    palette_hex: list[str]
    mood: list[Literal[
        "tense", "melancholic", "joyful", "ominous",
        "dreamy", "romantic", "gritty", "serene"
    ]]

    # 신규: 필터링용 (생성에는 직접 전달 안 함)
    setting: Literal["indoor", "outdoor"]
    location_type: Literal[
        "bar_pub_restaurant", "domestic", "office_work",
        "public_indoor", "street", "vehicle",
        "nature", "industrial", "fantastical_sci_fi", "other"
    ]
    lighting: Literal[
        "natural_day", "natural_dusk", "practical_warm", "practical_cool",
        "neon", "hard_directional", "soft_diffuse",
        "low_key_dark", "high_key_bright", "silhouette"
    ]
    time_of_day: Literal["day", "golden_hour", "blue_hour", "night", "indoor_no_window", "unknown"]

    description: str


SYSTEM_INSTRUCTION = """You are an image metadata analyzer for video reference libraries.
Analyze the provided film/drama still and return ONLY a JSON object matching the requested schema.
No prose, no markdown code fence — pure JSON."""


PROMPT = """Analyze this film/drama still for use in a video reference library.

Search priorities:
- Tier 1 (hard match): angle, people_count, composition, shot_size
- Tier 2 (soft match): color_mood, saturation, mood, palette_hex
- Filter axes (used to find ambiance match, NOT transferred to generation): setting, location_type, lighting, time_of_day

Classification guide:
- Key art (large title/logo, marketing graphic) → is_scene=false, is_keyart=true
- Cast collage / promotional composite → is_scene=false
- Authentic dramatic still (natural mise-en-scène) → is_scene=true
- reference_score (1-10): combination of composition, lighting, narrative impact. Average=5, striking=9-10.

Filter-axis guidance:
- setting: "indoor" if dominant scene is interior, "outdoor" otherwise
- location_type: choose the closest category. Examples:
    bar_pub_restaurant: bars, pubs, cafes, restaurants, dining halls
    domestic: home interiors (bedroom, kitchen, living room)
    office_work: offices, workspaces, labs, classrooms
    public_indoor: hallways, lobbies, stations, shops, hotels
    street: outdoor urban streets, alleys, plazas
    vehicle: car/train/plane interior or exterior
    nature: forest, mountain, beach, field, desert
    industrial: factories, warehouses, machinery
    fantastical_sci_fi: surreal/sci-fi/fantasy environments
    other: ambiguous or doesn't fit
- lighting: dominant lighting style (warm tungsten = practical_warm; bar/restaurant lamps usually practical_warm)
- time_of_day: best estimate. "indoor_no_window" if no time signal visible.

Return JSON with these exact keys (use only the allowed values):

{
  "is_scene": boolean,
  "is_keyart": boolean,
  "reference_score": int 1-10,
  "angle": "eye_level"|"low"|"high"|"overhead"|"dutch",
  "shot_size": "extreme_close"|"close"|"medium"|"wide"|"extreme_wide",
  "people_count": "none"|"solo"|"duo"|"group"|"crowd",
  "composition": array of ["centered","rule_of_thirds","symmetrical","leading_lines","negative_space","frame_within_frame"],
  "color_mood": "warm"|"cool"|"neutral"|"monochromatic"|"teal_orange",
  "saturation": "high"|"medium"|"muted",
  "palette_hex": array of 5 dominant HEX color strings,
  "mood": array of ["tense","melancholic","joyful","ominous","dreamy","romantic","gritty","serene"],
  "setting": "indoor"|"outdoor",
  "location_type": "bar_pub_restaurant"|"domestic"|"office_work"|"public_indoor"|"street"|"vehicle"|"nature"|"industrial"|"fantastical_sci_fi"|"other",
  "lighting": "natural_day"|"natural_dusk"|"practical_warm"|"practical_cool"|"neon"|"hard_directional"|"soft_diffuse"|"low_key_dark"|"high_key_bright"|"silhouette",
  "time_of_day": "day"|"golden_hour"|"blue_hour"|"night"|"indoor_no_window"|"unknown",
  "description": "1-2 English sentences usable as video generation prompt"
}

Output JSON only."""


def load_and_resize(img_path: Path) -> BytesIO:
    img = Image.open(img_path)
    if img.width > RESIZE_WIDTH:
        ratio = RESIZE_WIDTH / img.width
        img = img.resize((RESIZE_WIDTH, int(img.height * ratio)), Image.LANCZOS)
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY)
    buf.seek(0)
    buf.name = img_path.name  # replicate가 파일명 인식하도록
    return buf


def extract_json(text: str) -> dict:
    """모델 응답에서 JSON 추출 (markdown fence 제거 등)"""
    text = text.strip()
    # ```json ... ``` 또는 ``` ... ``` 제거
    fence = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    # 첫 { ~ 마지막 } 사이만
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


def call_gemini(img_buf: BytesIO) -> dict:
    output = replicate.run(
        MODEL,
        input={
            "prompt": PROMPT,
            "system_instruction": SYSTEM_INSTRUCTION,
            "images": [img_buf],
            "temperature": 0.2,
            "thinking_budget": 0,  # 메타데이터 추출은 thinking 불필요, 속도/비용 절감
            "max_output_tokens": 2048,
        },
    )
    # output은 보통 string chunks의 iterator
    if isinstance(output, str):
        text = output
    elif hasattr(output, "__iter__"):
        text = "".join(str(chunk) for chunk in output)
    else:
        text = str(output)
    return extract_json(text)


def analyze(img_path: Path) -> dict:
    last_err = None
    for attempt in range(1 + RETRY_ON_PARSE_FAIL):
        try:
            img_buf = load_and_resize(img_path)
            data = call_gemini(img_buf)
            ImageMeta(**data)  # 스키마 검증
            return data
        except (json.JSONDecodeError, ValidationError) as e:
            last_err = e
            if attempt < RETRY_ON_PARSE_FAIL:
                time.sleep(1)
                continue
    raise RuntimeError(f"파싱/검증 실패: {last_err}")


def main():
    if len(sys.argv) < 2:
        sys.exit("사용법: python analyze_images.py <폴더경로> [최대장수]")

    target_dir = Path(sys.argv[1])
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None

    if not target_dir.exists():
        sys.exit(f"폴더 없음: {target_dir}")

    excluded_dir = target_dir.parent / "_excluded" / target_dir.name
    excluded_dir.mkdir(parents=True, exist_ok=True)

    images = sorted(target_dir.glob("*.jpg"))
    if limit:
        images = images[:limit]

    print(f"대상: {len(images)}장 ({target_dir})")
    print(f"모델: {MODEL}")
    print("-" * 60)

    index = []
    excluded_count = 0
    fail_count = 0

    new_fields = ("setting", "location_type", "lighting", "time_of_day")

    for i, img_path in enumerate(images, 1):
        json_path = img_path.with_suffix(".json")

        cached_complete = False
        if json_path.exists():
            with open(json_path, encoding="utf-8") as f:
                meta = json.load(f)
            cached_complete = all(f in meta for f in new_fields)

        if cached_complete:
            print(f"[{i:03d}/{len(images)}] {img_path.name} — 캐시")
        else:
            try:
                meta = analyze(img_path)
                meta["filename"] = img_path.name
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(meta, f, ensure_ascii=False, indent=2)
                print(
                    f"[{i:03d}/{len(images)}] {img_path.name} — "
                    f"score={meta.get('reference_score')} "
                    f"scene={meta.get('is_scene')} "
                    f"keyart={meta.get('is_keyart')}"
                )
                time.sleep(SLEEP_BETWEEN)
            except Exception as e:
                fail_count += 1
                print(f"[{i:03d}/{len(images)}] {img_path.name} — FAIL: {e}")
                continue

        if not meta.get("is_scene", True) or meta.get("is_keyart", False):
            try:
                img_path.rename(excluded_dir / img_path.name)
                if json_path.exists():
                    json_path.rename(excluded_dir / json_path.name)
                meta["_excluded"] = True
                excluded_count += 1
                print(f"  → _excluded로 이동")
            except Exception as e:
                print(f"  → 이동 실패: {e}")

        index.append(meta)

    index_path = target_dir / "_index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print("-" * 60)
    print(f"완료: 처리 {len(index)}장 / 격리 {excluded_count}장 / 실패 {fail_count}장")
    print(f"인덱스: {index_path}")


if __name__ == "__main__":
    main()
