#!/usr/bin/env python3
"""유튜브 자동자막 → 정리된 본문 텍스트.

    python3 tools/yt_transcript.py <url|videoId> [출력파일]

왜 yt-dlp를 쓰나: 2026-08 기준 유튜브가 timedtext 직접 호출을 막았다.
watch 페이지에서 captionTracks의 baseUrl을 뽑아 그대로 요청하면 200에 0바이트가 온다
(fmt=json3/srv3/vtt 전부 동일). yt-dlp는 이 부분을 계속 따라가므로 그쪽에 맡긴다.

자동자막 VTT는 같은 문장이 한 글자씩 늘어나며 굴러간다. 그대로 쓰면 분량이 몇 배가 되고
읽을 수가 없어서, 앞 줄을 접두사로 포함하는 줄은 더 긴 쪽만 남긴다.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def video_id(s: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/live/)([A-Za-z0-9_-]{11})", s)
    return m.group(1) if m else s.strip()


def fetch_vtt(vid: str, workdir: Path) -> Path:
    subprocess.run(
        ["yt-dlp", "--skip-download", "--write-auto-sub", "--write-sub",
         "--sub-lang", "ko", "--sub-format", "vtt",
         "-o", str(workdir / "cap"), f"https://www.youtube.com/watch?v={vid}"],
        check=True, capture_output=True, text=True,
    )
    files = sorted(workdir.glob("cap*.vtt"))
    if not files:
        raise SystemExit("자막을 받지 못했습니다 (자막이 없는 영상일 수 있음)")
    return files[0]


def clean(vtt: str) -> str:
    body = re.sub(r"<[^>]+>", "", vtt)          # <00:00:01.234> 같은 타임태그
    lines: list[str] = []
    for ln in body.split("\n"):
        ln = ln.strip()
        if not ln or "-->" in ln or ln.isdigit():
            continue
        if ln.startswith(("WEBVTT", "Kind:", "Language:")):
            continue
        # 굴러가는 자막 접기: 직전 줄과 포함 관계면 긴 쪽만 남긴다
        if lines and (ln == lines[-1] or ln.startswith(lines[-1]) or lines[-1].endswith(ln)):
            if len(ln) > len(lines[-1]):
                lines[-1] = ln
            continue
        lines.append(ln)
    return re.sub(r"\s+", " ", " ".join(lines)).strip()


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    vid = video_id(sys.argv[1])

    with tempfile.TemporaryDirectory() as tmp:
        vtt = fetch_vtt(vid, Path(tmp))
        text = clean(vtt.read_text(encoding="utf-8"))

    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(f"transcript-{vid}.txt")
    out.write_text(text, encoding="utf-8")
    print(f"{out}  ({len(text):,}자)")


if __name__ == "__main__":
    main()
