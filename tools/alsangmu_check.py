#!/usr/bin/env python3
"""알상무 유튜브 요약이 몇 개 밀렸는지 센다.

왜 있나: 2026-09-19에 확인해보니 마지막 글이 9/5(9/2~9/4분)였고 그 뒤로 17개가 쌓여 있었다.
봇이 하는 일이 아니라 사람이 하는 일이라 botwatch가 못 보는 자리였다.
hunslog가 5개월간 허공에 쓰던 것과 같은 구멍이다.

세는 법: 블로그 레포의 마지막 alsangmu 글 날짜 이후에 채널에 올라온 영상 수.
"""
import re, subprocess, sys
from datetime import datetime
from pathlib import Path

POSTS = Path("/Users/hun/shud-blog/content/posts")
CHANNEL = "UCiDmfbYvuMEVbRxPmFP4sng"   # 알상무


def last_post_date():
    newest = None
    for f in POSTS.glob("alsangmu-*.mdx"):
        m = re.search(r"^date:\s*(\d{4}-\d{2}-\d{2})", f.read_text(), re.M)
        if m:
            d = datetime.strptime(m.group(1), "%Y-%m-%d").date()
            if newest is None or d > newest:
                newest = d
    return newest


def recent_videos(limit=40):
    try:
        out = subprocess.run(
            ["yt-dlp", "--flat-playlist", "--skip-download", "--playlist-end", str(limit),
             "--print", "%(id)s|%(title)s",
             f"https://www.youtube.com/channel/{CHANNEL}/videos"],
            capture_output=True, text=True, timeout=180)
        return [l for l in out.stdout.strip().split("\n") if "|" in l]
    except Exception as e:
        print("영상 목록 조회 실패: %s" % str(e)[:60]); return None


def main():
    last = last_post_date()
    if not last:
        print("알상무 글을 못 찾음"); return
    vids = recent_videos()
    if vids is None:
        # ⚠️ 조회 실패를 "0개 밀림"으로 처리하지 않는다. 모르는 것과 괜찮은 것은 다르다.
        print("⚠️ 채널 조회 실패 — 밀린 개수를 모른다"); return
    # 마지막 글에 링크된 영상 ID 이후를 센다
    done = set()
    for f in POSTS.glob("alsangmu-*.mdx"):
        done |= set(re.findall(r"watch\?v=([A-Za-z0-9_-]{11})", f.read_text()))
    pending = []
    for line in vids:
        vid, title = line.split("|", 1)
        if vid in done:
            break          # 정리한 영상을 만나면 그 아래는 전부 처리된 것
        pending.append((vid, title))
    days = (datetime.now().date() - last).days
    if pending:
        print("📺 알상무 요약 %d개 밀림 (마지막 글 %s · %d일 전)" % (len(pending), last, days))
        for vid, title in pending[:5]:
            print("     · %s" % title[:46])
        if len(pending) > 5:
            print("     · 외 %d개" % (len(pending) - 5))
    else:
        print("📺 알상무 요약 밀린 것 없음 (마지막 글 %s)" % last)


if __name__ == "__main__":
    main()
