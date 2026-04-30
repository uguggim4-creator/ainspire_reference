"""모든 reference 폴더 재분석 — 병렬 실행, 단일 배경 잡"""
import os
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

REF = Path("reference")
WORKERS = 8  # 병렬 폴더 수 (Replicate 부하 조절)


def analyze_folder(folder: Path):
    proc = subprocess.run(
        [sys.executable, "analyze_images.py", str(folder)],
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        capture_output=True, text=True, encoding="utf-8",
    )
    # 마지막 요약 라인 추출
    lines = (proc.stdout or "").strip().split("\n")
    summary = lines[-2] if len(lines) >= 2 else (lines[-1] if lines else "")
    return folder.name, proc.returncode, summary


def main():
    folders = sorted(
        d for d in REF.iterdir()
        if d.is_dir() and not d.name.startswith("_")
    )
    print(f"재분석 대상: {len(folders)}개 폴더 ({WORKERS}개 병렬)")
    print("=" * 70, flush=True)

    ok = fail = 0
    with ProcessPoolExecutor(max_workers=WORKERS) as ex:
        futures = {ex.submit(analyze_folder, f): f for f in folders}
        for i, fut in enumerate(as_completed(futures), 1):
            name, code, summary = fut.result()
            status = "OK  " if code == 0 else "FAIL"
            print(f"[{i:02d}/{len(folders)}] [{status}] {name}", flush=True)
            print(f"           {summary}", flush=True)
            if code == 0:
                ok += 1
            else:
                fail += 1

    print("=" * 70)
    print(f"완료: 성공 {ok} / 실패 {fail}")


if __name__ == "__main__":
    main()
