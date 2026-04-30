"""Pinterest API v5 토큰 검증 + 핀 목록 샘플 조회"""
import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("PINTEREST_ACCESS_TOKEN")
if not TOKEN:
    sys.exit("PINTEREST_ACCESS_TOKEN not set in .env")

BASE = "https://api.pinterest.com/v5"
H = {"Authorization": f"Bearer {TOKEN}"}


def get(path, params=None):
    r = requests.get(f"{BASE}{path}", headers=H, params=params, timeout=15)
    return r.status_code, r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text


print("=" * 60)
print("[1] /user_account — 토큰 유효성 + 계정 정보")
print("=" * 60)
code, data = get("/user_account")
print(f"status: {code}")
print(json.dumps(data, indent=2, ensure_ascii=False)[:500])

if code != 200:
    sys.exit("토큰 검증 실패 — 종료")

print()
print("=" * 60)
print("[2] /pins — 첫 페이지 (page_size=5)")
print("=" * 60)
code, data = get("/pins", params={"page_size": 5})
print(f"status: {code}")
items = data.get("items", []) if isinstance(data, dict) else []
print(f"item count (this page): {len(items)}")
print(f"bookmark (next page): {data.get('bookmark') if isinstance(data, dict) else None}")

if items:
    print("\n--- 첫 핀 샘플 ---")
    sample = items[0]
    print(f"id: {sample.get('id')}")
    print(f"title: {sample.get('title')}")
    print(f"media_type: {sample.get('media', {}).get('media_type') if sample.get('media') else None}")
    media = sample.get("media", {})
    images = media.get("images", {}) if isinstance(media, dict) else {}
    print(f"available image sizes: {list(images.keys())}")
    if "originals" in images:
        print(f"originals url: {images['originals'].get('url')}")
        print(f"originals size: {images['originals'].get('width')}x{images['originals'].get('height')}")

print()
print("=" * 60)
print("[3] 전체 핀 개수 카운트 (페이징 순회)")
print("=" * 60)
total = 0
bookmark = None
pages = 0
while True:
    params = {"page_size": 100}
    if bookmark:
        params["bookmark"] = bookmark
    code, data = get("/pins", params=params)
    if code != 200:
        print(f"error at page {pages}: {code} — {data}")
        break
    items = data.get("items", [])
    total += len(items)
    pages += 1
    bookmark = data.get("bookmark")
    print(f"  page {pages}: +{len(items)} (cumulative: {total})")
    if not bookmark or pages >= 50:  # 안전 상한
        break

print(f"\n총 핀 개수: {total} (페이지: {pages})")
