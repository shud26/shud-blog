"use client";

import { useEffect, useState } from "react";

/**
 * 지금 온체인에서 돈이 어디로 움직이는지 보는 화면.
 *
 * ⚠️ 이 화면은 "사세요/파세요"를 말하지 않는다. 지금 값이 어떤지만 보여준다.
 *    "기회"라는 표현도 쓰지 않는다. 숫자가 변했다는 사실만 적는다.
 *
 * ⚠️ 브라우저가 열릴 때마다 DefiLlama에서 직접 받아온다(약 3.7MB, 1초).
 *    서버도 크론도 없다. 그래서 항상 최신이고, 내가 손댈 게 없다.
 *
 * ⚠️ 비율만 보면 속는다. "어제 거의 0 → 오늘 조금"이 +34,000%로 찍힌다.
 *    그래서 절대 금액 하한과 비율 상한을 같이 건다.
 */

const UP = "#c4620a";
const DN = "#1a5fb4";
const INK = "#111111";
const MID = "#6b7280";
const FAINT = "#9ca3af";
const LINE = "#e5e7eb";

const MIN_TVL = 10_000_000;
const JUMP_7D = 20;
const MIN_FEE = 500_000;
const FEE_JUMP = 60;
const MIN_DEX = 5_000_000;
const DEX_JUMP = 80;
const MAX_JUMP = 900;        // 기저가 0에 가까운 것 제외
const NEW_DAYS = 21;
const MIN_NEW_TVL = 5_000_000;
const DROP_7D = -25;
const EXC = new Set(["CEX", "Chain", "Bridge"]);

type Row = {
  name: string; slug: string; symbol?: string | null; cat?: string | null;
  chain?: string | null; tvl: number; url?: string | null; kind: string; metric: string; rank: number;
};

const KIND: Record<string, string> = {
  tvl_up: "돈이 몰림", fee_up: "수수료 급증", vol_up: "거래량 급증",
  new: "새로 생김", tvl_down: "돈이 빠짐",
};
const QUOTA: Record<string, number> = { tvl_up: 12, fee_up: 6, vol_up: 6, new: 6, tvl_down: 6 };

function won(usd: number, rate: number) {
  if (!rate || !usd) return "";
  const w = Math.abs(usd) * rate, s = usd < 0 ? "-" : "";
  if (w >= 1e12) return `${s}${(w / 1e12).toFixed(0)}조원`;
  if (w >= 1e8) return `${s}${(w / 1e8).toLocaleString("en-US", { maximumFractionDigits: 0 })}억원`;
  return `${s}${(w / 1e4).toLocaleString("en-US", { maximumFractionDigits: 0 })}만원`;
}
function usdK(n: number) {
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e12) return `${s}${(a / 1e12).toFixed(1)}조`;
  if (a >= 1e8) return `${s}${(a / 1e8).toLocaleString("en-US", { maximumFractionDigits: 0 })}억`;
  return `${s}${(a / 1e4).toLocaleString("en-US", { maximumFractionDigits: 0 })}만`;
}

async function j(u: string) {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export default function Page() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [top, setTop] = useState<any>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const [protos, fees, dexs, chains, stab, fx] = await Promise.all([
          j("https://api.llama.fi/protocols"),
          j("https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true"),
          j("https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true"),
          j("https://api.llama.fi/v2/chains"),
          j("https://stablecoins.llama.fi/stablecoins?includePrices=false"),
          j("https://open.er-api.com/v6/latest/USD").catch(() => null),
        ]);
        const rate = fx?.rates?.KRW || 0;
        const mc = (x: any, k: string) => x?.[k]?.peggedUSD || 0;
        const pegs = stab.peggedAssets || [];
        const sNow = pegs.reduce((s: number, p: any) => s + mc(p, "circulating"), 0);
        const sWk = sNow - pegs.reduce((s: number, p: any) => s + mc(p, "circulatingPrevWeek"), 0);
        setTop({
          rate,
          tvl: chains.reduce((s: number, c: any) => s + (c.tvl || 0), 0),
          stab: sNow, week: sWk, dex24: dexs.total24h || 0,
        });

        const bySlug = new Map(protos.map((p: any) => [p.slug, p]));
        const seen = new Set<string>();
        const out: Row[] = [];
        const add = (p: any, kind: string, metric: string, rank: number) => {
          if (!p || seen.has(p.slug)) return;
          seen.add(p.slug);
          out.push({ name: p.name, slug: p.slug, symbol: p.symbol, cat: p.category,
                     chain: p.chain, tvl: p.tvl || 0, url: p.url, kind, metric, rank });
        };
        for (const p of protos) {
          if ((p.tvl || 0) >= MIN_TVL && p.change_7d != null && p.change_7d >= JUMP_7D && !EXC.has(p.category))
            add(p, "tvl_up", `묶인 돈 7일 ${p.change_7d > 0 ? "+" : ""}${p.change_7d.toFixed(0)}%`, p.change_7d);
        }
        for (const f of fees.protocols || []) {
          const v = f.total24h || 0, c = f.change_1d;
          if (v >= MIN_FEE && c != null && c >= FEE_JUMP && c <= MAX_JUMP)
            add(bySlug.get(f.slug), "fee_up", `수수료 하루 +${c.toFixed(0)}% ($${(v / 1e6).toFixed(1)}M)`, c);
        }
        for (const f of dexs.protocols || []) {
          const v = f.total24h || 0, c = f.change_1d;
          if (v >= MIN_DEX && c != null && c >= DEX_JUMP && c <= MAX_JUMP)
            add(bySlug.get(f.slug), "vol_up", `거래량 하루 +${c.toFixed(0)}% ($${(v / 1e6).toFixed(0)}M)`, c);
        }
        const now = Date.now() / 1000;
        for (const p of protos) {
          if (p.listedAt && (p.tvl || 0) >= MIN_NEW_TVL && now - p.listedAt <= NEW_DAYS * 86400 && !EXC.has(p.category))
            add(p, "new", `${((now - p.listedAt) / 86400).toFixed(0)}일 전 등록`, 20);
        }
        for (const p of protos) {
          if (p.change_7d != null && p.change_7d <= DROP_7D && (p.tvl || 0) >= MIN_TVL && !EXC.has(p.category))
            add(p, "tvl_down", `묶인 돈 7일 ${p.change_7d.toFixed(0)}%`, Math.abs(p.change_7d));
        }
        const final: Row[] = [];
        for (const k of Object.keys(QUOTA)) {
          final.push(...out.filter((r) => r.kind === k).sort((a, b) => b.rank - a.rank).slice(0, QUOTA[k]));
        }
        setRows(final);
      } catch (e: any) {
        setErr(`데이터를 못 받았습니다 (${e.message})`);
      }
    })();
  }, []);

  if (err) return <main style={S.wrap}><h1 style={S.h1}>온체인 자금 흐름</h1><div style={S.warn}>{err}</div></main>;
  if (!rows || !top) return <main style={S.wrap}><p style={S.dim}>값 받는 중… (약 1초)</p></main>;

  const up = top.week >= 0;
  const shown = tab === "all" ? rows : rows.filter((r) => r.kind === tab);
  const counts: Record<string, number> = {};
  rows.forEach((r) => { counts[r.kind] = (counts[r.kind] || 0) + 1; });

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>온체인 자금 흐름</h1>
      <p style={S.sub}>
        코인 시장 전체에서 돈이 어디로 움직이는지 봅니다. 브라우저가 열릴 때마다
        DefiLlama에서 직접 받아오므로 항상 최신입니다.
      </p>

      <div style={{ ...S.hero, borderColor: up ? "#f0d9c4" : "#c9d9ee" }}>
        <div style={S.heroLab}>이번 주 달러코인</div>
        <div style={{ ...S.heroNum, color: up ? UP : DN }}>
          {up ? "▲ +" : "▼ "}{usdK(top.week)}<span style={S.heroU}>달러</span>
        </div>
        <div style={S.heroSub}>
          {up ? "코인 시장에 새 돈이 들어오는 중입니다." : "코인 시장에서 돈이 빠지는 중입니다."}
          {top.rate ? ` (${won(top.week, top.rate)})` : ""}
        </div>
      </div>

      <div style={S.stats}>
        {[["묶여 있는 돈", top.tvl], ["돌아다니는 달러코인", top.stab], ["어제 거래된 돈", top.dex24]].map(([l, v]: any) => (
          <div key={l} style={S.stat}>
            <div style={S.statL}>{l}</div>
            <div style={S.statV}>{usdK(v)}<span style={S.statU}>달러</span></div>
            <div style={S.statK}>{won(v, top.rate)}</div>
          </div>
        ))}
      </div>

      <div style={S.tabs}>
        {[["all", `전체 ${rows.length}`], ...Object.keys(KIND).map((k) => [k, `${KIND[k]} ${counts[k] || 0}`])].map(([k, l]: any) => (
          <button key={k} onClick={() => setTab(k)}
                  style={{ ...S.tab, ...(tab === k ? S.tabOn : {}) }}>{l}</button>
        ))}
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <tbody>
            {shown.map((r) => (
              <tr key={r.slug}>
                <td style={S.tdName}>
                  {r.url
                    ? <a href={r.url} target="_blank" rel="noopener" style={S.link}>{r.name}</a>
                    : r.name}
                  <a href={`https://defillama.com/protocol/${r.slug}`} target="_blank" rel="noopener" style={S.ext}>정보</a>
                  <div style={S.tdSub}>
                    <b style={{ color: INK }}>{KIND[r.kind]}</b> {r.metric}
                    {r.cat ? ` · ${r.cat}` : ""}{r.chain ? ` · ${r.chain}` : ""}
                  </div>
                </td>
                <td style={S.tdNum}>
                  {usdK(r.tvl)}<span style={{ color: FAINT, fontSize: 11 }}> 달러</span>
                  <div style={S.tdSub2}>{won(r.tvl, top.rate)}</div>
                </td>
                <td style={S.tdTok}>{r.symbol && r.symbol !== "-" ? r.symbol : <span style={{ color: FAINT }}>없음</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.note}>
        <b>다섯 가지를 봅니다</b><br />
        <b>돈이 몰림</b> 예치금이 일주일 새 20% 이상 늘어난 곳 ·
        <b> 수수료 급증</b> 하루 매출이 60% 이상 뛴 곳(하루 50만 달러 이상) ·
        <b> 거래량 급증</b> 하루 거래가 80% 이상 늘어난 곳(하루 500만 달러 이상) ·
        <b> 새로 생김</b> 3주 안에 등록된 곳 ·
        <b> 돈이 빠짐</b> 예치금이 일주일 새 25% 이상 줄어든 곳
        <br /><br />
        <b>비율만 보면 속습니다</b><br />
        어제 거의 0이었다가 오늘 조금 생기면 +34,000%로 찍힙니다.
        그래서 절대 금액 하한을 두고, 비율이 900%를 넘는 것은 아예 뺐습니다.
        <br /><br />
        <b>이 화면이 못 보는 것</b><br />
        왜 움직였는지는 알 수 없습니다. 숫자가 변했다는 사실만 보여줍니다.
        그리고 앞으로 어떻게 될지도 모릅니다.
        <br /><br />
        <span style={{ color: FAINT }}>
          이 화면은 투자 판단을 돕거나 특정 종목을 권하지 않습니다. 공개된 온체인 집계 수치를 그대로 옮긴 것입니다.
        </span>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 820, margin: "0 auto", padding: "48px 18px 90px" },
  h1: { fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" },
  sub: { fontSize: 14, color: MID, lineHeight: 1.75, margin: "0 0 26px" },
  dim: { color: FAINT, fontSize: 14 },
  warn: { border: `1px solid ${LINE}`, borderRadius: 10, padding: 16, fontSize: 14, color: MID },
  hero: { border: "1px solid", borderRadius: 14, padding: "18px 20px", background: "#fcfcfb" },
  heroLab: { fontSize: 12, color: FAINT },
  heroNum: { fontSize: 38, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.15, margin: "4px 0 6px" },
  heroU: { fontSize: 15, fontWeight: 400, color: MID, marginLeft: 6 },
  heroSub: { fontSize: 13, color: MID, lineHeight: 1.7 },
  stats: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: `1px solid ${LINE}`, marginTop: 24 },
  stat: { padding: "16px 14px 16px 0" },
  statL: { fontSize: 11.5, color: FAINT, marginBottom: 5 },
  statV: { fontSize: 20, fontWeight: 650, letterSpacing: "-0.02em" },
  statU: { fontSize: 12, color: MID, fontWeight: 400, marginLeft: 2 },
  statK: { fontSize: 11, color: FAINT, marginTop: 2 },
  tabs: { display: "flex", gap: 6, flexWrap: "wrap", margin: "28px 0 4px" },
  tab: { fontFamily: "inherit", fontSize: 12.5, fontWeight: 550, color: MID, background: "#fff",
         border: `1px solid ${LINE}`, borderRadius: 999, padding: "6px 13px", cursor: "pointer" },
  tabOn: { background: INK, color: "#fff", borderColor: INK },
  tableWrap: { border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", marginTop: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  tdName: { padding: "13px 12px", borderBottom: `1px solid ${LINE}`, fontWeight: 550, verticalAlign: "top" },
  tdSub: { fontSize: 11.5, color: FAINT, fontWeight: 400, marginTop: 3, lineHeight: 1.5 },
  tdSub2: { fontSize: 11, color: FAINT, fontWeight: 400, marginTop: 2 },
  tdNum: { padding: "13px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right",
           whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", verticalAlign: "top" },
  tdTok: { padding: "13px 12px 13px 4px", borderBottom: `1px solid ${LINE}`, fontSize: 12.5,
           color: MID, width: 70, verticalAlign: "top" },
  link: { color: INK, textDecoration: "none", borderBottom: "1px solid #d7dbe0" },
  ext: { fontSize: 10.5, color: FAINT, marginLeft: 8, textDecoration: "none", fontWeight: 500 },
  note: { marginTop: 36, paddingTop: 22, borderTop: `1px solid ${LINE}`, fontSize: 12.5, color: MID, lineHeight: 1.9 },
};
