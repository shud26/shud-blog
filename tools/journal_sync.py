#!/usr/bin/env python3
"""체결 원장 → 매매일지 자동 기입.

왜 만들었나 (2026-08-31):
  일지가 반쪽이었다. 매수는 적었는데 **매도를 안 적었다.**
  8월 실현손익이 132만원으로 잡혀 있었는데 체결 원장 기준으로는 763만원이었다.
  빠진 날: 8/13 · 8/14 · 8/20 · 8/27.
  **번 돈이 일지에 안 들어가 있어서 두 달 동안 자기 성적을 몰랐다.**

  일지 파일에는 처음부터 `<!-- auto-trades -->` 마커가 있었다.
  설계 의도는 자동 기입이었는데 파이프라인이 없었을 뿐이다. 그 사이를 채운다.

⚠️ **이미 있는 내용은 절대 덮어쓰지 않는다.**
   2026-08-31 첫 시도에서 7/15의 "(이력 밖 취득분 매도는 미산입)" 주석을 지워먹었다.
   자동화가 사람의 기록을 삭제하면 그건 도구가 아니라 사고다.

   그래서 이렇게만 한다:
     · 일지 파일이 **없는 날** → 새로 만든다
     · 파일은 있는데 마커 안이 **비어 있으면** → 채운다
     · 이미 내용이 있으면 → **손대지 않고, 숫자가 다르면 경고만 한다**

   고칠지 말지는 사람이 정한다. 이 스크립트는 "누락을 찾아주는 것"이지
   "기록을 관리하는 것"이 아니다.

⚠️ 업비트 등 원장에 없는 거래는 손대지 않는다. 그 날짜 파일은 건드리지 않는다.

사용:
    python3 tools/journal_sync.py            # 맥미니에서 원장 받아와서 반영
    python3 tools/journal_sync.py --local     # 받지 않고 로컬 원장으로
    python3 tools/journal_sync.py --dry       # 뭐가 바뀔지만 보여주고 안 씀
"""
import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from collections import defaultdict, deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOURNAL = ROOT / "content/journal"
LEDGER = ROOT / "tools/journal_fills.json"
REMOTE = "shud@100.111.61.74"
RPATH = "toss_etf_bot/journal_fills.json"

NAMES = {"000660": "SK하이닉스", "069500": "KODEX 200", "073240": "금호타이어"}

BEGIN, END = "<!-- auto-trades -->", "<!-- /auto-trades -->"


def pull() -> bool:
    r = subprocess.run(
        ["scp", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15",
         f"{REMOTE}:{RPATH}", str(LEDGER)], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ⚠️ 원장 받기 실패: {r.stderr.strip()[:120]}")
        return False
    print(f"  ✓ journal_fills.json")
    return True


def load_fills():
    """날짜별 체결 목록. 시간순."""
    if not LEDGER.exists():
        sys.exit(f"원장이 없습니다: {LEDGER}\n  → --local 없이 실행해서 맥미니에서 받아오세요.")
    d = json.loads(LEDGER.read_text(encoding="utf-8"))
    rows = []
    for v in d.values():
        e = v.get("execution") or {}
        if not e.get("filledAt"):
            continue
        rows.append({
            "t": e["filledAt"], "date": e["filledAt"][:10], "hm": e["filledAt"][11:16],
            "sym": v.get("symbol", "?"), "side": v["side"],
            "qty": int(e["filledQuantity"]), "px": float(e["averageFilledPrice"]),
        })
    rows.sort(key=lambda r: r["t"])
    return rows


def realized_by_day(rows):
    """FIFO 실현손익을 날짜별로 계산한다.

    ⚠️ 일지 본문이 "FIFO, 세전"이라고 적혀 있으므로 평균단가가 아니라 FIFO로 맞춘다.
       (전량 청산이면 두 방식이 같지만 분할 매도에서 갈린다)
    """
    lots = defaultdict(deque)   # symbol -> deque[[qty, px]]
    day = defaultdict(float)
    for r in rows:
        if r["side"] == "BUY":
            lots[r["sym"]].append([r["qty"], r["px"]])
            continue
        remain, pnl = r["qty"], 0.0
        while remain > 0 and lots[r["sym"]]:
            lot = lots[r["sym"]][0]
            take = min(remain, lot[0])
            pnl += take * (r["px"] - lot[1])
            lot[0] -= take
            remain -= take
            if lot[0] == 0:
                lots[r["sym"]].popleft()
        day[r["date"]] += pnl
    return day


def table(day_rows) -> str:
    out = ["| 시간 | 종목 | 방향 | 수량 | 체결가 | reason_code |",
           "|---|---|---|---|---|---|"]
    for r in day_rows:
        out.append(f"| {r['hm']} | {NAMES.get(r['sym'], r['sym'])} | {r['side'].lower()} "
                   f"| {r['qty']} | {r['px']:,.0f} | 수동 |")
    return "\n".join(out)


TEMPLATE = """---
date: {date}
strategy_tag: 수동단타
market_regime: volatile
plan: "(자동 기입 — 체결 원장에서 생성. 사전 계획은 직접 채울 것)"
conviction: 3
plan_followed: Y
pnl_realized: {pnl}
pnl_unrealized: 0
slippage_bps: 0
mistake_tag: 없음
emotion: ""
---

## 체결 기록 (자동)
{begin}
{table}

이날 실현손익(FIFO, 세전): **{pnl_s}원**
{end}

## 오늘의 실수 / 교훈
- (직접 채우기)
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--local", action="store_true", help="원장을 받지 않고 로컬 파일로")
    ap.add_argument("--dry", action="store_true", help="바뀔 내용만 보여주고 쓰지 않음")
    a = ap.parse_args()

    if not a.local:
        print("맥미니에서 체결 원장 받는 중…")
        pull()

    rows = load_fills()
    by_day = defaultdict(list)
    for r in rows:
        by_day[r["date"]].append(r)
    pnl = realized_by_day(rows)

    JOURNAL.mkdir(parents=True, exist_ok=True)
    made, updated, same, mismatch = [], [], [], []

    for date in sorted(by_day):
        f = JOURNAL / f"{date}.md"
        p = round(pnl.get(date, 0.0))
        blk = f"{BEGIN}\n{table(by_day[date])}\n\n이날 실현손익(FIFO, 세전): **{p:+,}원**\n{END}"

        if not f.exists():
            body = TEMPLATE.format(date=date, pnl=p, pnl_s=f"{p:+,}",
                                   begin=BEGIN, end=END, table=table(by_day[date]))
            if not a.dry:
                f.write_text(body, encoding="utf-8")
            made.append(f"{date}  {p:+,}원  ({len(by_day[date])}건)")
            continue

        cur = f.read_text(encoding="utf-8")
        if BEGIN not in cur or END not in cur:
            print(f"  ⚠️ {date} — 마커가 없어 건너뜁니다")
            continue

        inner = re.search(re.escape(BEGIN) + r"(.*?)" + re.escape(END), cur, re.S).group(1)
        if inner.strip():
            # 이미 사람이 채워둔 블록 — 절대 안 건드린다. 숫자만 대조한다.
            m = re.search(r"^pnl_realized:\s*(-?[\d.]+)", cur, re.M)
            have = round(float(m.group(1))) if m else None
            if have is not None and have != p:
                mismatch.append(f"{date}  일지 {have:+,} vs 원장 {p:+,}  (차이 {p-have:+,})")
            else:
                same.append(date)
            continue

        # 마커는 있는데 비어 있음 → 채운다
        new = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END),
                     lambda _: blk, cur, flags=re.S)
        new = re.sub(r"^pnl_realized:.*$", f"pnl_realized: {p}", new, count=1, flags=re.M)
        if not a.dry:
            f.write_text(new, encoding="utf-8")
        updated.append(f"{date}  {p:+,}원 (빈 블록 채움)")

    tag = "[모의] " if a.dry else ""
    print(f"\n{tag}새로 만듦 {len(made)} · 갱신 {len(updated)} · 그대로 {len(same)}")
    for x in made:
        print(f"  + {x}")
    for x in updated:
        print(f"  ~ {x}")
    if mismatch:
        print(f"\n⚠️ 일지와 원장의 숫자가 다릅니다 ({len(mismatch)}건) — 자동으로 고치지 않았습니다:")
        for x in mismatch:
            print(f"  ! {x}")
        print("  → 확인하고 직접 고치세요. 주석이 붙어 있으면 그럴 만한 이유가 있을 수 있습니다.")

    # 월별 검산 — 원장 합계와 일지 합계가 맞는지
    print("\n월별 실현손익 (원장 기준):")
    m = defaultdict(float)
    for d, v in pnl.items():
        m[d[:7]] += v
    for k in sorted(m):
        print(f"  {k}  {round(m[k]):+,}원")
    print("\n⚠️ 업비트 등 원장에 없는 거래(크립토)는 손대지 않았습니다. 직접 적으세요.")


if __name__ == "__main__":
    main()
