"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * 온체인 vs 거래소 가격차 확인 화면.
 *
 * ⚠️ 이 화면은 "사세요/파세요"를 말하지 않는다. 지금 값이 얼마인지만 보여준다.
 *
 * ⚠️ 2026-09-16에 배운 것: 가격 "차이"만 보면 안 된다.
 *    같은 날 Beefy 하베스트를 재보니 자리는 비어 있는데(주소 18개) 97.5%가 적자였다.
 *    비어 있는 자리는 비어 있을 만해서 비어 있었다.
 *    그래서 이 화면은 차이가 아니라 **차이에서 비용을 뺀 값**을 크게 보여준다.
 *
 * ⚠️ 못 보는 것: 거래소로 돈을 옮기는 데 걸리는 시간. 그 사이 가격이 움직인다.
 *    여기 숫자는 "지금 동시에 된다면"의 값이라 실제보다 후하다.
 */

// ── 고칠 일이 있으면 여기만 ──────────────────────────────
const CEX_FEE = 0.001;      // 거래소 체결 수수료 (0.1%)
const WITHDRAW_USD = 3;     // 거래소에서 빼낼 때 드는 돈 (대략)
const SIZES = [1000, 10000, 50000, 200000];

const TOK = {
  USDC: { addr: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", dec: 6 },
  USDT: { addr: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", dec: 6 },
  WETH: { addr: "0x4200000000000000000000000000000000000006", dec: 18 },
};

type Row = {
  size: number;
  onchain: number;   // 온체인에서 받는 값(달러 환산)
  cex: number;       // 거래소에서 받는 값(달러 환산)
  gap: number;       // 차이(달러)
  gas: number;
  net: number;       // 비용까지 뺀 최종(달러)
};

type Pair = { key: string; label: string; rows: Row[]; cexPx: number };

async function kyber(inT: keyof typeof TOK, outT: keyof typeof TOK, human: number) {
  const a = TOK[inT], b = TOK[outT];
  const raw = BigInt(Math.round(human * 10 ** a.dec)).toString();
  const u =
    `https://aggregator-api.kyberswap.com/base/api/v1/routes` +
    `?tokenIn=${a.addr}&tokenOut=${b.addr}&amountIn=${raw}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`온체인 견적 ${r.status}`);
  const j = await r.json();
  if (j.code !== 0) throw new Error("온체인 견적을 못 받았습니다");
  const s = j.data.routeSummary;
  return { out: Number(s.amountOut) / 10 ** b.dec, gas: Number(s.gasUsd || 0) };
}

async function binance(symbol: string) {
  const r = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`);
  if (!r.ok) throw new Error(`거래소 호가 ${r.status}`);
  const j = await r.json();
  return { bid: Number(j.bidPrice), ask: Number(j.askPrice) };
}

export default function GapPage() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [at, setAt] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [su, se] = await Promise.all([binance("USDCUSDT"), binance("ETHUSDT")]);

      const stable: Row[] = [];
      for (const size of SIZES) {
        const q = await kyber("USDC", "USDT", size);
        const cex = size * su.bid;
        const gap = q.out - cex;
        stable.push({
          size, onchain: q.out, cex, gap, gas: q.gas,
          net: gap - size * CEX_FEE - WITHDRAW_USD - q.gas,
        });
      }

      const eth: Row[] = [];
      for (const size of SIZES.slice(0, 3)) {
        const q = await kyber("USDC", "WETH", size);
        const cexEth = size / se.ask;
        const gap = (q.out - cexEth) * se.bid;
        eth.push({
          size, onchain: q.out * se.bid, cex: cexEth * se.bid, gap, gas: q.gas,
          net: gap - size * CEX_FEE - WITHDRAW_USD - q.gas,
        });
      }

      setPairs([
        { key: "stable", label: "USDC를 USDT로 바꿀 때", rows: stable, cexPx: su.bid },
        { key: "eth", label: "USDC로 이더리움을 살 때", rows: eth, cexPx: se.ask },
      ]);
      setAt(new Date().toLocaleTimeString("ko-KR"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !pairs.length)
    return <main style={S.wrap}><p style={S.dim}>값 받는 중…</p></main>;

  if (err && !pairs.length)
    return (
      <main style={S.wrap}>
        <h1 style={S.h1}>온체인 vs 거래소 가격차</h1>
        <div style={S.warn}>
          <b>값을 못 받았습니다.</b> ({err})<br />
          이 화면으로 판단하지 마세요. <b>모르는 것과 괜찮은 것은 다릅니다.</b>
        </div>
      </main>
    );

  const main10k = pairs[0]?.rows.find((r) => r.size === 10000);
  const anyPositive = pairs.some((p) => p.rows.some((r) => r.net > 0));

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>온체인 vs 거래소 가격차</h1>
      <p style={S.sub}>
        같은 것을 온체인(Base)에서 살 때와 거래소에서 살 때 값이 다릅니다.
        그 차이가 <b>수수료보다 큰지</b>만 봅니다. {at && `· ${at} 기준`}
      </p>

      <div style={{ ...S.hero, ...(anyPositive ? S.heroOn : {}) }}>
        <div style={S.heroHead}>
          {anyPositive ? "지금은 차이가 비용보다 큽니다" : "지금은 차이가 비용보다 작습니다"}
        </div>
        <div style={S.heroBody}>
          {main10k ? (
            <>
              1만 달러를 바꾼다고 하면, 온체인이 거래소보다{" "}
              <b>{fmt(main10k.gap)}</b> 더 줍니다.<br />
              그런데 거래소 수수료 <b>{fmt(main10k.size * CEX_FEE)}</b>와
              빼내는 값 <b>{fmt(WITHDRAW_USD)}</b>가 나갑니다.<br />
              <span style={{ fontSize: 17, fontWeight: 700,
                             color: main10k.net > 0 ? "#0f7b3d" : "#c02626" }}>
                남는 돈 {fmt(main10k.net)}
              </span>
            </>
          ) : "값을 받는 중입니다."}
        </div>
        <div style={S.liveBox}>
          넘어야 하는 선: 온체인 차이가 <b>{fmt(10000 * CEX_FEE + WITHDRAW_USD)}</b>(1만 달러 기준)보다
          커야 남는 게 생깁니다.
        </div>
      </div>

      {pairs.map((p) => (
        <section key={p.key}>
          <h2 style={S.h2}>{p.label}</h2>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>바꾸는 돈</th>
                  <th style={S.thR}>온체인이 더 주는 돈</th>
                  <th style={S.thR}>빠지는 비용</th>
                  <th style={S.thR}>남는 돈</th>
                </tr>
              </thead>
              <tbody>
                {p.rows.map((r) => {
                  const cost = r.size * CEX_FEE + WITHDRAW_USD + r.gas;
                  return (
                    <tr key={r.size}>
                      <td style={S.td}>{fmt(r.size)}</td>
                      <td style={S.tdR}>{fmt(r.gap)}</td>
                      <td style={S.tdR}>{fmt(cost)}</td>
                      <td style={{ ...S.tdR, fontWeight: 700,
                                   color: r.net > 0 ? "#0f7b3d" : "#c02626" }}>
                        {fmt(r.net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2 style={S.h2}>이 숫자가 뭔지</h2>
      <ul style={S.ul}>
        <li><b>온체인이 더 주는 돈</b> — 같은 금액을 넣었을 때 온체인에서 받는 양과 거래소에서 받는 양의 차이입니다. 미끄러짐(많이 넣을수록 값이 나빠지는 것)이 이미 반영된 실제 견적입니다.</li>
        <li><b>빠지는 비용</b> — 거래소 수수료 {(CEX_FEE * 100).toFixed(2)}%, 거래소에서 돈을 빼낼 때 드는 값 {fmt(WITHDRAW_USD)}, 온체인 수수료를 더한 값입니다.</li>
        <li><b>남는 돈</b> — 위 둘의 차이입니다. <b>이 값이 플러스가 아니면 아무 의미가 없습니다.</b></li>
      </ul>

      <h2 style={S.h2}>이 화면이 못 보는 것</h2>
      <ul style={S.ul}>
        <li>거래소로 돈을 옮기는 데 걸리는 시간. 그 사이 값이 움직입니다. 여기 숫자는 <b>동시에 된다고 쳤을 때</b>라 실제보다 후합니다.</li>
        <li>지금 이 순간 한 번 본 값입니다. 하루 종일 이런지는 모릅니다.</li>
        <li>거래소에 돈이 미리 들어가 있어야 합니다. 없으면 시작도 못 합니다.</li>
      </ul>

      <div style={S.foot}>
        <button style={S.btn} onClick={load} disabled={loading}>
          {loading ? "받는 중…" : "다시 받기"}
        </button>
        {err && <span style={{ ...S.dim, marginLeft: 12 }}>마지막 시도 실패: {err}</span>}
      </div>

      <p style={{ ...S.note, marginTop: 28 }}>
        값은 Base 체인 견적과 거래소 공개 호가를 그대로 가져온 것입니다.
        이 화면은 기록용이며 무엇을 사고팔라는 뜻이 아닙니다.
      </p>
    </main>
  );
}

function fmt(v: number) {
  const s = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2);
  return `${v < 0 ? "-" : ""}$${Math.abs(Number(s)).toLocaleString("en-US")}`;
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" },
  h1: { fontSize: 23, margin: "0 0 4px", letterSpacing: "-0.02em" },
  h2: { fontSize: 16, margin: "34px 0 10px", letterSpacing: "-0.01em" },
  sub: { color: "#6b7280", fontSize: 13, lineHeight: 1.8, margin: "0 0 22px" },
  note: { fontSize: 13, lineHeight: 1.8, color: "#6b7280" },
  dim: { color: "#6b7280", fontSize: 14 },
  warn: { border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b",
          borderRadius: 10, padding: "16px 18px", fontSize: 14, lineHeight: 1.8 },
  hero: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", marginBottom: 18 },
  heroOn: { borderColor: "#0f7b3d", background: "#f0fdf4" },
  heroHead: { fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 },
  heroBody: { fontSize: 14.5, lineHeight: 1.9, color: "#374151" },
  liveBox: { marginTop: 14, paddingTop: 12, borderTop: "1px dashed #e5e7eb",
             fontSize: 13.5, lineHeight: 1.8, color: "#374151" },
  tableWrap: { border: "1px solid #e5e7eb", borderRadius: 12, overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5,
           fontVariantNumeric: "tabular-nums" },
  th: { textAlign: "left", padding: "11px 14px", color: "#6b7280", fontWeight: 600,
        fontSize: 12.5, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  thR: { textAlign: "right", padding: "11px 14px", color: "#6b7280", fontWeight: 600,
         fontSize: 12.5, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  td: { padding: "11px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" },
  tdR: { padding: "11px 14px", borderBottom: "1px solid #f3f4f6", textAlign: "right",
         whiteSpace: "nowrap" },
  ul: { fontSize: 14.5, lineHeight: 1.9, color: "#374151", paddingLeft: 20, margin: "0 0 12px" },
  foot: { marginTop: 32 },
  btn: { fontSize: 13.5, padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db",
         background: "#fff", cursor: "pointer" },
};
