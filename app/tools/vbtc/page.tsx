"use client";

import { useState, useEffect } from "react";

/**
 * BTC 이격도 규칙 대시보드 — 아침에 한 번 열어보는 화면.
 *
 * ⚠️ 이 페이지는 **봇의 상태가 아니라 규칙의 계산**이다.
 *    브라우저에서 바이낸스 공개 API를 직접 받아 규칙을 다시 계산한다.
 *    "봇이 실제로 뭘 했나"는 텔레그램이 담당한다. 둘이 어긋나면 그게 사고 신호다.
 *
 * ⚠️ 잔고·손익 금액은 올리지 않는다. 공개 페이지다.
 *
 * 규칙 출처: shud-brain/notes/전략/크립토-매도규칙-사전등록-2026-08-27.md (개정판)
 *   진입  UTC 종가가 MA20 위로 올라선 날
 *   1차   이격 +14% → 절반
 *   2차   이격 +22% 또는 종가가 MA20 아래 → 전량
 *   손절  없음
 */

const MA_N = 20;
const T1 = 14;
const T2 = 22;

type Bar = { date: string; close: number };

export default function VbtcPage() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=60"
        );
        if (!r.ok) throw new Error(`바이낸스 응답 ${r.status}`);
        const ks = await r.json();
        // 마지막 봉은 진행 중이라 버린다. 확정 종가만 쓴다 (봇과 같은 규칙).
        const rows: Bar[] = ks.slice(0, -1).map((k: (string | number)[]) => ({
          date: new Date(Number(k[0])).toISOString().slice(0, 10),
          close: Number(k[4]),
        }));
        setBars(rows);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main style={S.wrap}><p style={S.dim}>바이낸스에서 받는 중…</p></main>;
  if (err || bars.length < MA_N + 2)
    return (
      <main style={S.wrap}>
        <h1 style={S.h1}>BTC 이격도 규칙</h1>
        <p style={{ ...S.dim, color: "#c02626" }}>
          ⚠️ 시세를 못 받았습니다 ({err || "봉 부족"}). 모르는 것과 괜찮은 것은 다릅니다 —
          이 화면으로 판단하지 마세요.
        </p>
      </main>
    );

  const closes = bars.map((b) => b.close);
  const last = bars[bars.length - 1];
  const ma = closes.slice(-MA_N).reduce((a, b) => a + b, 0) / MA_N;
  const maPrev = closes.slice(-MA_N - 1, -1).reduce((a, b) => a + b, 0) / MA_N;
  const gap = (last.close / ma - 1) * 100;
  const crossedUp = last.close > ma && closes[closes.length - 2] <= maPrev;

  // 각 조건이 발동하는 가격
  const pxT1 = ma * (1 + T1 / 100);
  const pxT2 = ma * (1 + T2 / 100);

  // 가격이 지금 수준에 머물 때 MA20이 언제 따라붙나
  const proj: { d: number; ma: number; gap: number }[] = [];
  {
    let w = closes.slice(-(MA_N - 1));
    for (let d = 1; d <= 21; d++) {
      w = [...w, last.close].slice(-MA_N);
      const m = w.reduce((a, b) => a + b, 0) / MA_N;
      proj.push({ d, ma: m, gap: (last.close / m - 1) * 100 });
    }
  }
  const meet = proj.find((p) => Math.abs(p.gap) < 2);

  const state = crossedUp
    ? { txt: "🟢 진입 조건 — 오늘 매수", c: "#0f7b3d" }
    : gap >= T2
    ? { txt: "🔴 2차 청산 구간", c: "#c02626" }
    : gap >= T1
    ? { txt: "🟠 1차 청산 구간 (절반)", c: "#b45309" }
    : { txt: "⚪ 조건 없음 — 대기", c: "#6b7280" };

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>BTC 이격도 규칙</h1>
      <p style={S.sub}>
        UTC 확정봉 {last.date} 기준 · 브라우저에서 직접 계산
      </p>

      <div style={{ ...S.hero, borderColor: state.c }}>
        <div style={{ ...S.heroTxt, color: state.c }}>{state.txt}</div>
        <div style={S.heroNum}>
          이격 <b>{gap >= 0 ? "+" : ""}{gap.toFixed(1)}%</b>
        </div>
      </div>

      <div style={S.grid}>
        <Cell label="확정 종가" v={`$${Math.round(last.close).toLocaleString()}`} />
        <Cell label={`MA${MA_N}`} v={`$${Math.round(ma).toLocaleString()}`} />
        <Cell label="1차 청산가" v={`$${Math.round(pxT1).toLocaleString()}`} sub={`이격 +${T1}%`} />
        <Cell label="2차 청산가" v={`$${Math.round(pxT2).toLocaleString()}`} sub={`이격 +${T2}%`} />
      </div>

      <h2 style={S.h2}>지금 무슨 일이 일어나야 하나</h2>
      <table style={S.table}>
        <tbody>
          <Row
            on={crossedUp}
            k="진입"
            v={`종가가 MA20($${Math.round(ma).toLocaleString()})을 아래→위로 통과`}
          />
          <Row on={gap >= T1} k="1차 청산 (절반)" v={`$${Math.round(pxT1).toLocaleString()} 이상`} />
          <Row on={gap >= T2} k="2차 청산 (전량)" v={`$${Math.round(pxT2).toLocaleString()} 이상`} />
          <Row on={last.close < ma} k="2차 청산 (추세종료)" v={`종가가 MA20 아래로 마감`} />
          <Row on={false} k="손절" v="없음 — 이 규칙엔 손절이 없다" />
        </tbody>
      </table>

      {!crossedUp && gap > 0 && (
        <>
          <h2 style={S.h2}>진입 신호까지</h2>
          <p style={S.p}>
            지금은 이격이 <b>{gap.toFixed(1)}%</b>라 <b>사지 않는다.</b> 진입하려면 가격이
            MA20까지 내려갔다가 다시 위로 올라서야 한다. 가격이 지금 수준
            (${Math.round(last.close).toLocaleString()})에 머물면 MA20이 이렇게 따라붙는다.
          </p>
          <table style={S.table}>
            <tbody>
              {proj
                .filter((p) => p.d % 3 === 0 || p.d === 1)
                .map((p) => (
                  <tr key={p.d} style={S.tr}>
                    <td style={S.td}>{p.d}일 뒤</td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      MA20 ${Math.round(p.ma).toLocaleString()}
                    </td>
                    <td
                      style={{
                        ...S.td,
                        textAlign: "right",
                        color: Math.abs(p.gap) < 2 ? "#0f7b3d" : "#6b7280",
                        fontWeight: Math.abs(p.gap) < 2 ? 600 : 400,
                      }}
                    >
                      이격 {p.gap >= 0 ? "+" : ""}{p.gap.toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {meet && (
            <p style={S.note}>
              → 대략 <b>{meet.d}일 뒤</b>에 가격과 MA20이 만난다. 그 언저리부터 진입 신호가
              나올 수 있다. <b>물론 가격이 그대로 있을 리는 없다</b> — 이건 방향을 보는 계산이지
              예측이 아니다.
            </p>
          )}
        </>
      )}

      <h2 style={S.h2}>이 화면을 믿으면 안 되는 것</h2>
      <ul style={S.ul}>
        <li>
          <b>이건 봇의 상태가 아니라 규칙의 계산이다.</b> 봇이 실제로 주문을 넣었는지는 여기
          안 나온다. 그건 텔레그램이 알려준다. <b>둘이 어긋나면 그게 사고 신호다.</b>
        </li>
        <li>
          <b>매수·매도 추천이 아니다.</b> 내가 나를 위해 미리 적어둔 규칙을 다시 계산해
          보여주는 개인 기록이다. 투자 조언이 아니고 나는 라이선스 있는 자문가가 아니다.
        </li>
        <li>
          <b>이 규칙엔 손절이 없다.</b> 9년 백테스트 최악이 -50.5%였다(코로나). 그걸 알고
          고른 규칙이고, 그래서 소액으로만 돌린다.
        </li>
      </ul>

      <p style={S.foot}>
        규칙 전문은 개인 노트에 사전등록해 두었다 ·{" "}
        <a href="/posts/measure-your-own-trades-0827" style={S.a}>
          어떻게 만들었는지 쓴 글
        </a>
      </p>
    </main>
  );
}

function Cell({ label, v, sub }: { label: string; v: string; sub?: string }) {
  return (
    <div style={S.cell}>
      <div style={S.cellLabel}>{label}</div>
      <div style={S.cellV}>{v}</div>
      {sub && <div style={S.cellSub}>{sub}</div>}
    </div>
  );
}

function Row({ on, k, v }: { on: boolean; k: string; v: string }) {
  return (
    <tr style={S.tr}>
      <td style={{ ...S.td, width: 26 }}>{on ? "🟢" : "⚪"}</td>
      <td style={{ ...S.td, fontWeight: on ? 600 : 400, whiteSpace: "nowrap" }}>{k}</td>
      <td style={{ ...S.td, color: "#6b7280" }}>{v}</td>
    </tr>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" },
  h1: { fontSize: 24, margin: "0 0 4px", letterSpacing: "-0.02em" },
  h2: { fontSize: 16, margin: "32px 0 10px", letterSpacing: "-0.01em" },
  sub: { color: "#6b7280", fontSize: 13, margin: "0 0 24px" },
  p: { fontSize: 14, lineHeight: 1.75, margin: "0 0 12px" },
  note: { fontSize: 13, lineHeight: 1.8, color: "#6b7280", marginTop: 12 },
  dim: { color: "#6b7280", fontSize: 14 },
  hero: {
    border: "2px solid", borderRadius: 12, padding: "18px 20px", marginBottom: 20,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 8,
  },
  heroTxt: { fontSize: 17, fontWeight: 700 },
  heroNum: { fontSize: 15, fontVariantNumeric: "tabular-nums" },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10,
  },
  cell: { border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" },
  cellLabel: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  cellV: { fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  cellSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5 },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "9px 6px", fontVariantNumeric: "tabular-nums" },
  ul: { fontSize: 13.5, lineHeight: 1.85, color: "#374151", paddingLeft: 18 },
  foot: { marginTop: 36, fontSize: 12.5, color: "#9ca3af" },
  a: { color: "#2563eb" },
};
