"""Supabase Storage에 썸네일 일괄 업로드 (신규분만)

사용법:
    python upload_to_supabase.py              # 미리보기
    python upload_to_supabase.py --apply      # 실제 업로드
    python upload_to_supabase.py --apply --all  # 전체 재업로드
"""
import json
import sys
import os
import io
import time
import hashlib
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from PIL import Image
except ImportError:
    print("pip install Pillow 필요")
    sys.exit(1)

# ── 설정 ──
SUPABASE_URL = "https://nxdkzhwcjfrykdfkuelm.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZGt6aHdjamZyeWtkZmt1ZWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjExODE2NSwiZXhwIjoyMDc3Njk0MTY1fQ.LYT1JMADoIbAE5QA9aTZXLGJfaOhSZJs2__eh1Jm7nE")
BUCKET = "ainspire"
REFERENCE_DIR = Path("E:/Ainspire_reference/reference")
UPLOADED_LOG = Path("E:/Ainspire_reference/.uploaded_thumbs.json")
THUMB_WIDTH = 480
THUMB_QUALITY = 75
MAX_WORKERS = 4

STORAGE_URL = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}"
HEADERS = {
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "x-upsert": "true",
}


def load_uploaded() -> set[str]:
    if UPLOADED_LOG.exists():
        return set(json.loads(UPLOADED_LOG.read_text(encoding="utf-8")))
    return set()


def save_uploaded(uploaded: set[str]):
    UPLOADED_LOG.write_text(json.dumps(sorted(uploaded), ensure_ascii=False), encoding="utf-8")


def make_thumbnail(img_path: Path) -> bytes:
    with Image.open(img_path) as img:
        img = img.convert("RGB")
        ratio = THUMB_WIDTH / img.width
        new_h = int(img.height * ratio)
        if ratio < 1:
            img = img.resize((THUMB_WIDTH, new_h), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=THUMB_QUALITY, optimize=True)
        return buf.getvalue()


def work_key(work: str) -> str:
    return hashlib.md5(work.encode()).hexdigest()[:8]


def upload_one(img_path: Path, work: str, filename: str) -> tuple[str, bool, str]:
    storage_path = f"thumbs/{work_key(work)}/{filename}"
    try:
        data = make_thumbnail(img_path)
        resp = requests.post(
            f"{STORAGE_URL}/{storage_path}",
            headers={**HEADERS, "Content-Type": "image/jpeg"},
            data=data,
            timeout=30,
        )
        if resp.status_code in (200, 201):
            return storage_path, True, "ok"
        else:
            return storage_path, False, f"HTTP {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        return storage_path, False, str(e)[:100]


def collect_images() -> list[tuple[Path, str, str]]:
    items = []
    for work_dir in sorted(REFERENCE_DIR.iterdir()):
        if not work_dir.is_dir() or work_dir.name.startswith("_"):
            continue
        index_path = work_dir / "_index.json"
        if not index_path.exists():
            continue
        with open(index_path, encoding="utf-8") as f:
            entries = json.load(f)
        for entry in entries:
            if entry.get("_excluded") or not entry.get("is_scene"):
                continue
            fn = entry["filename"]
            img_path = work_dir / fn
            if img_path.exists():
                items.append((img_path, work_dir.name, fn))
    return items


def main():
    apply = "--apply" in sys.argv
    upload_all = "--all" in sys.argv
    items = collect_images()

    uploaded = set() if upload_all else load_uploaded()
    new_items = [(p, w, f) for p, w, f in items if f"{w}/{f}" not in uploaded]

    print(f"전체: {len(items)}장 | 신규: {len(new_items)}장 | 모드: {'업로드' if apply else '미리보기'}", flush=True)

    if not apply:
        for _, work, fn in new_items[:10]:
            print(f"  thumbs/{work_key(work)}/{fn}")
        if len(new_items) > 10:
            print(f"  ... 외 {len(new_items) - 10}장")
        print(f"\n실제 업로드: python upload_to_supabase.py --apply")
        return

    if not new_items:
        print("업로드할 신규 이미지 없음")
        return

    success = 0
    fail = 0
    start = time.time()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {
            pool.submit(upload_one, p, w, f): (w, f)
            for p, w, f in new_items
        }
        for i, future in enumerate(as_completed(futures), 1):
            path, ok, msg = future.result()
            w, f = futures[future]
            if ok:
                success += 1
                uploaded.add(f"{w}/{f}")
            else:
                fail += 1
                print(f"  FAIL: {path} - {msg}", flush=True)
            if i % 100 == 0 or i == len(new_items):
                elapsed = time.time() - start
                rate = i / elapsed if elapsed > 0 else 0
                print(f"  [{i}/{len(new_items)}] {rate:.1f}/s | OK: {success} FAIL: {fail}", flush=True)

    save_uploaded(uploaded)
    elapsed = time.time() - start
    print(f"\n완료: {success} 업로드, {fail} 실패 ({elapsed:.0f}초)")


if __name__ == "__main__":
    main()
