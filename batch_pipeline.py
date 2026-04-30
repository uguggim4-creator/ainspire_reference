"""batch_titles.txt의 모든 작품을 다운로드 + 분석"""
import os
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

TITLES_FILE = Path("batch_titles.txt")
WORKERS = 8


def run_pipeline(title: str):
    proc = subprocess.run(
        [sys.executable, "pipeline.py", title],
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        capture_output=True, text=True, encoding="utf-8",
    )
    lines = (proc.stdout or "").strip().split("\n")
    summary = lines[-2] if len(lines) >= 2 else (lines[-1] if lines else "")
    return title, proc.returncode, summary


def main():
    titles = [
        line.strip() for line in TITLES_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    print(f"배치 파이프라인: {len(titles)}편 ({WORKERS}개 병렬)")
    print("=" * 70, flush=True)

    ok = fail = 0
    failed_titles = []

    with ProcessPoolExecutor(max_workers=WORKERS) as ex:
        futures = {ex.submit(run_pipeline, t): t for t in titles}
        for i, fut in enumerate(as_completed(futures), 1):
            title, code, summary = fut.result()
            status = "OK  " if code == 0 else "FAIL"
            print(f"[{i:02d}/{len(titles)}] [{status}] {title}", flush=True)
            print(f"           {summary}", flush=True)
            if code == 0:
                ok += 1
            else:
                fail += 1
                failed_titles.append(title)

    print("=" * 70)
    print(f"완료: 성공 {ok} / 실패 {fail}")
    if failed_titles:
        print(f"실패 목록: {failed_titles}")


if __name__ == "__main__":
    main()
