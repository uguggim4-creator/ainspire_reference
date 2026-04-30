"""다운로드 + Gemini 분석을 한 번에 실행"""
import os
import re
import subprocess
import sys

env = {**os.environ, "PYTHONIOENCODING": "utf-8"}


def main(query: str):
    # 1) 다운로드
    proc = subprocess.run(
        [sys.executable, "download_backdrops.py", query],
        env=env, capture_output=True, text=True, encoding="utf-8",
    )
    sys.stdout.write(proc.stdout)
    sys.stderr.write(proc.stderr)
    if proc.returncode != 0:
        sys.exit(f"다운로드 실패: {query}")

    # 폴더 경로 추출
    m = re.search(r"저장 위치:\s*(.+)$", proc.stdout, re.MULTILINE)
    if not m:
        sys.exit("폴더 경로 추출 실패")
    folder = m.group(1).strip()

    print(f"\n→ 분석 시작: {folder}\n", flush=True)

    # 2) 분석
    proc = subprocess.run(
        [sys.executable, "analyze_images.py", folder], env=env
    )
    sys.exit(proc.returncode)


if __name__ == "__main__":
    main(sys.argv[1])
