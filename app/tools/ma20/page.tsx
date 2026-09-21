"use client";

import { useEffect, useState } from "react";

/**
 * 비트코인이 20일 평균선에서 얼마나 떨어져 있나 (이격도).
 *
 * ⚠️ 이 화면은 "사세요/파세요"를 말하지 않는다. 지금 값이 어디인지만 보여준다.
 *
 * ⚠️ 색은 눈으로 고르지 않았다. 적록색맹에서 초록/빨강은 ΔE 5.2로 거의 같게 보인다.
 *    주황/파랑으로 바꿔 ΔE 24.8을 확보했다. 위=뜨거움(주황), 아래=차가움(파랑).
 *
 * ⚠️ 못 보는 것: 이 값이 앞으로 어디로 갈지. 과거 분포는 미래를 보장하지 않는다.
 */

const UP = "#c4620a";     // 평균선 위 (과열 쪽)
const DN = "#1a5fb4";     // 평균선 아래 (눌림 쪽)
const INK = "#111111";
const MID = "#6b7280";
const FAINT = "#9ca3af";
const LINE = "#e5e7eb";

const MA_N = 20;
const TREND_DAYS = 180;

type Pt = { d: string; close: number; ma: number; gap: number };

function nf(n: number, dp = 0) {
  return n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export default function Page() {
  const [pts, setPts] = useState<Pt[] | null>(null);
  const [err, setErr] = useState("");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000"
        );
        if (!r.ok) throw new Error(`가격을 못 받았습니다 (${r.status})`);
        const raw: string[][] = await r.json();
        // 마지막 봉은 아직 진행 중이라 버린다. 확정된 종가만 쓴다.
        const rows = raw.slice(0, -1).map((k) => ({
          d: new Date(Number(k[0])).toISOString().slice(0, 10),
          close: Number(k[4]),
        }));
        const out: Pt[] = [];
        for (let i = MA_N; i < rows.length; i++) {
          const ma = rows.slice(i - MA_N, i).reduce((s, x) => s + x.close, 0) / MA_N;
          out.push({ d: rows[i].d, close: rows[i].close, ma, gap: (rows[i].close / ma - 1) * 100 });
        }
        setPts(out);
      } catch (e: any) {
        setErr(e.message || "오류");
      }
    })();
  }, []);

  if (err) return <main style={S.wrap}><h1 style={S.h1}>20일 평균선 이격도</h1><div style={S.warn}>{err}</div></main>;
  if (!pts) return <main style={S.wrap}><p style={S.dim}>값 받는 중…</p></main>;

  const cur = pts[pts.length - 1];
  const trend = pts.slice(-TREND_DAYS);
  const shown = hover !== null ? trend[hover] : cur;

  // ── 분포: 2% 구간으로 묶는다
  const BIN = 2;
  const bins = new Map<number, number>();
  for (const p of pts) {
    const b = Math.floor(p.gap / BIN) * BIN;
    bins.set(b, (bins.get(b) || 0) + 1);
  }
  const keys = Array.from(bins.keys()).sort((a, b) => a - b);
  const maxCount = Math.max(...Array.from(bins.values()));
  const curBin = Math.floor(cur.gap / BIN) * BIN;
  const above = pts.filter((p) => p.gap > cur.gap).length;
  const pctAbove = (above / pts.length) * 100;

  // ── 추이 차트 좌표
  const W = 720, H = 210, PX = 8, PY = 14;
  const gaps = trend.map((p) => p.gap);
  const lo = Math.min(...gaps, -2), hi = Math.max(...gaps, 2);
  const span = Math.max(Math.abs(lo), Math.abs(hi)) * 1.08;
  const x = (i: number) => PX + (i / (trend.length - 1)) * (W - PX * 2);
  const y = (g: number) => PY + ((span - g) / (span * 2)) * (H - PY * 2);
  const zero = y(0);
  const line = trend.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.gap).toFixed(1)}`).join("");
  const areaUp = `${line}L${x(trend.length - 1).toFixed(1)},${zero}L${x(0).toFixed(1)},${zero}Z`;

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>20일 평균선 이격도</h1>
      <p style={S.sub}>
        비트코인 값이 <b>최근 20일 평균</b>에서 얼마나 떨어져 있는지 보여줍니다.
        위로 벌어지면 짧은 사이에 많이 올랐다는 뜻이고, 아래로 벌어지면 그 반대입니다.
        <br />브라우저가 열릴 때마다 바이낸스에서 직접 받아오므로 항상 최신입니다.
      </p>

      {/* 헤드라인 */}
      <div style={{ ...S.hero, borderColor: cur.gap >= 0 ? "#f0d9c4" : "#c9d9ee" }}>
        <div style={S.heroLab}>지금 이격도</div>
        <div style={{ ...S.heroNum, color: cur.gap >= 0 ? UP : DN }}>
          {cur.gap >= 0 ? "+" : ""}{nf(cur.gap, 1)}%
        </div>
        <div style={S.heroSub}>
          값 ${nf(cur.close)} · 20일 평균 ${nf(cur.ma)} · {cur.d} 확정
        </div>
        <div style={S.heroSub}>
          지난 {nf(pts.length)}일 중 지금보다 더 벌어진 날은 <b>{nf(pctAbove, 0)}%</b>였습니다.
        </div>
      </div>

      {/* 추이 */}
      <h2 style={S.h2}>최근 {TREND_DAYS}일</h2>
      <div style={S.chartBox}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
             onMouseLeave={() => setHover(null)}
             onMouseMove={(e) => {
               const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
               const rel = ((e.clientX - r.left) / r.width) * W;
               const i = Math.round(((rel - PX) / (W - PX * 2)) * (trend.length - 1));
               setHover(Math.max(0, Math.min(trend.length - 1, i)));
             }}>
          <defs>
            <clipPath id="up"><rect x="0" y="0" width={W} height={zero} /></clipPath>
            <clipPath id="dn"><rect x="0" y={zero} width={W} height={H - zero} /></clipPath>
          </defs>
          {[-20, -10, 10, 20].filter((v) => Math.abs(v) < span).map((v) => (
            <g key={v}>
              <line x1={PX} x2={W - PX} y1={y(v)} y2={y(v)} stroke={LINE} strokeWidth="1" strokeDasharray="3 4" />
              <text x={W - PX} y={y(v) - 3} textAnchor="end" fontSize="9.5" fill={FAINT}>{v > 0 ? "+" : ""}{v}%</text>
            </g>
          ))}
          <path d={areaUp} fill={UP} opacity="0.13" clipPath="url(#up)" />
          <path d={areaUp} fill={DN} opacity="0.13" clipPath="url(#dn)" />
          <path d={line} fill="none" stroke={UP} strokeWidth="2" clipPath="url(#up)" strokeLinejoin="round" />
          <path d={line} fill="none" stroke={DN} strokeWidth="2" clipPath="url(#dn)" strokeLinejoin="round" />
          <line x1={PX} x2={W - PX} y1={zero} y2={zero} stroke={MID} strokeWidth="1.2" />
          <text x={PX + 2} y={zero - 4} fontSize="9.5" fill={MID}>평균선 (0%)</text>
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PY} y2={H - PY} stroke={FAINT} strokeWidth="1" />
              <circle cx={x(hover)} cy={y(trend[hover].gap)} r="4.5"
                      fill={trend[hover].gap >= 0 ? UP : DN} stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>
        <div style={S.readout}>
          <b>{shown.d}</b>
          <span style={{ color: shown.gap >= 0 ? UP : DN, fontWeight: 700 }}>
            {shown.gap >= 0 ? "+" : ""}{nf(shown.gap, 1)}%
          </span>
          <span style={{ color: MID }}>값 ${nf(shown.close)} · 평균 ${nf(shown.ma)}</span>
        </div>
      </div>

      {/* 분포 */}
      <h2 style={S.h2}>지난 {nf(pts.length)}일 동안 이격도가 어디에 많았나</h2>
      <div style={S.chartBox}>
        <svg viewBox="0 0 720 150" style={{ width: "100%", height: "auto", display: "block" }}>
          {keys.map((k, i) => {
            const bw = (720 - 16) / keys.length;
            const bx = 8 + i * bw;
            const h = ((bins.get(k) || 0) / maxCount) * 104;
            const isCur = k === curBin;
            return (
              <g key={k}>
                <rect x={bx + 0.8} y={120 - h} width={Math.max(1, bw - 1.6)} height={h} rx="2"
                      fill={k >= 0 ? UP : DN} opacity={isCur ? 1 : 0.28} />
                {isCur && (
                  <>
                    <text x={bx + bw / 2} y={120 - h - 20} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>지금</text>
                    <text x={bx + bw / 2} y={120 - h - 8} textAnchor="middle" fontSize="9.5" fill={MID}>여기</text>
                  </>
                )}
                {k % 10 === 0 && (
                  <text x={bx + bw / 2} y={134} textAnchor="middle" fontSize="9.5" fill={FAINT}>{k > 0 ? "+" : ""}{k}%</text>
                )}
              </g>
            );
          })}
          <line x1="8" x2="712" y1="120" y2="120" stroke={LINE} strokeWidth="1" />
        </svg>
        <div style={S.readout}>
          <span style={{ color: MID }}>
            막대가 높을수록 그 구간에 있던 날이 많았다는 뜻입니다. 진한 막대가 지금 자리입니다.
          </span>
        </div>
      </div>

      <div style={S.note}>
        <b>왜 시간이 지나면 값이 줄어드나</b><br />
        20일 평균은 매일 다시 계산됩니다. 값이 그대로 있어도 평균이 따라 올라오면 이격도는 저절로
        줄어듭니다. 그래서 이 값은 <b>많이 오르면</b>이 아니라 <b>빨리 오르면</b> 커집니다.
        <br /><br />
        <b>이 화면이 못 보는 것</b><br />
        앞으로 어디로 갈지는 모릅니다. 위 분포는 지난 {nf(pts.length)}일의 기록일 뿐이고,
        같은 자리에서 다음에 무슨 일이 일어날지는 그때마다 달랐습니다.
        <br /><br />
        <span style={{ color: FAINT }}>
          색은 눈으로 고르지 않았습니다. 초록/빨강은 적록색맹에서 거의 같게 보여(ΔE 5.2)
          주황/파랑으로 바꿨습니다(ΔE 24.8). 위는 뜨거운 쪽, 아래는 차가운 쪽입니다.
        </span>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 780, margin: "0 auto", padding: "48px 18px 90px" },
  h1: { fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" },
  h2: { fontSize: 15, fontWeight: 650, margin: "38px 0 10px" },
  sub: { fontSize: 14, color: MID, lineHeight: 1.75, margin: "0 0 26px" },
  dim: { color: FAINT, fontSize: 14 },
  warn: { border: `1px solid ${LINE}`, borderRadius: 10, padding: 16, fontSize: 14, color: MID },
  hero: { border: "1px solid", borderRadius: 14, padding: "20px 22px", background: "#fcfcfb" },
  heroLab: { fontSize: 12, color: FAINT },
  heroNum: { fontSize: 44, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, margin: "4px 0 8px" },
  heroSub: { fontSize: 13, color: MID, lineHeight: 1.7 },
  chartBox: { border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 12px 10px" },
  readout: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "baseline",
             fontSize: 12.5, padding: "10px 4px 2px", borderTop: `1px solid ${LINE}`, marginTop: 8 },
  note: { marginTop: 40, paddingTop: 22, borderTop: `1px solid ${LINE}`,
          fontSize: 12.5, color: MID, lineHeight: 1.9 },
};
