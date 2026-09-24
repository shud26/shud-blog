"use client";

import { useEffect, useState } from "react";

/**
 * 펀딩 성분 보기 — 퍼프 거래소가 주는 펀딩을 두 조각으로 쪼갠다.
 *
 *   총 펀딩 = 거래소가 정한 기본 이자율 + 시장이 만든 프리미엄
 *
 * ⚠️ 왜 쪼개나. Arcus SOL 펀딩이 연 +10.71%라 "롱이 레버리지 값을 낸다"고 읽었는데
 *    1,000건 중 915건이 **정확히 0.0000125**였다. 8시간당 0.01%, 거래소 기본 이자율 상수다.
 *    시장 수요만 빼면 연 -0.24%. 거의 0이었다. **숫자가 아니라 성분을 봐야 한다.**
 *
 * ⚠️ 이 화면은 사라거나 팔라고 말하지 않는다. 지금 값이 어디인지만 보여준다.
 *
 * ⚠️ 색은 눈으로 고르지 않았다. 적록색맹에서 초록/빨강은 ΔE 5.2로 거의 같게 보인다.
 *    주황(숏이 받음)/파랑(롱이 받음)으로 ΔE 24.8을 확보했다. (tools/ma20 규칙과 동일)
 *
 * ⚠️ 못 보는 것: 프리미엄이 앞으로 어디로 갈지. 표본은 최근 1,000시간이고
 *    그동안 시장은 대체로 한 방향이었다. 내리는 장에서 부호가 뒤집힌 구간이 표본에 거의 없다.
 */

const UP = "#c4620a";     // 숏이 받는 쪽
const DN = "#1a5fb4";     // 롱이 받는 쪽
const INK = "#111111";
const MID = "#6b7280";
const FAINT = "#9ca3af";
const LINE = "#e5e7eb";

const API = "https://api.arcus.xyz";
/** 8시간당 0.01% = 시간당 0.0000125. 거래소 기본 이자율 성분. */
const DEFAULT_HOURLY = 0.0000125;
const HOURS_YEAR = 24 * 365;
/** 이보다 얇으면 프리미엄이 커도 대문에 안 올린다.
 *  첫 실행에서 하루 거래량 $11만짜리가 프리미엄 +132%로 1등이었다. 그건 기회가 아니라 노이즈다. */
const THIN_USD = 1_000_000;
/** 화면이 무거워지지 않게 거래량 상위 이만큼만 본다. */
const TOP_N = 26;

type Row = {
  market: string; vol: number; n: number;
  total: number; premium: number; pinned: number; neg: number;
};

function money(n: number) {
  const a = Math.abs(n);
  if (a >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (a >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만`;
  return Math.round(n).toLocaleString();
}

export default function Page() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [at, setAt] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const mr = await fetch(`${API}/v1/markets`);
        if (!mr.ok) throw new Error(`시장 목록을 못 받았습니다 (${mr.status})`);
        const markets = (await mr.json()).markets
          .filter((m: any) => m.status === "ONLINE")
          .sort((a: any, b: any) => Number(b.volume24hNotional || 0) - Number(a.volume24hNotional || 0))
          .slice(0, TOP_N);

        const out: Row[] = [];
        for (const m of markets) {
          try {
            const r = await fetch(`${API}/v1/fundingRates?market=${m.marketDisplayName}`);
            if (!r.ok) continue;
            const rates: number[] = (await r.json()).fundingRates.map((x: any) => Number(x.fundingRate));
            if (!rates.length) continue;
            const n = rates.length;
            const avg = rates.reduce((s, x) => s + x, 0) / n;
            out.push({
              market: m.marketDisplayName.replace("-USD", ""),
              vol: Number(m.volume24hNotional || 0),
              n,
              total: avg * HOURS_YEAR * 100,
              premium: (avg - DEFAULT_HOURLY) * HOURS_YEAR * 100,
              pinned: (rates.filter((x) => Math.abs(x - DEFAULT_HOURLY) < 1e-12).length / n) * 100,
              neg: (rates.filter((x) => x < 0).length / n) * 100,
            });
          } catch { /* 한 시장 실패가 전체를 막지 않는다 */ }
        }
        if (!out.length) throw new Error("펀딩 자료를 하나도 못 받았습니다");
        out.sort((a, b) => b.premium - a.premium);
        setRows(out);
        setAt(new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }));
      } catch (e: any) {
        setErr(e.message || "오류");
      }
    })();
  }, []);

  if (err)
    return (
      <main style={S.wrap}>
        <h1 style={S.h1}>펀딩 성분 보기</h1>
        <div style={S.warn}>{err}</div>
      </main>
    );
  if (!rows)
    return (
      <main style={S.wrap}>
        <h1 style={S.h1}>펀딩 성분 보기</h1>
        <p style={S.dim}>값 받는 중…</p>
      </main>
    );

  const good = rows.filter((r) => r.premium >= 3);
  const bad = rows.filter((r) => r.premium <= -3);
  const liquid = good.filter((r) => r.vol >= THIN_USD);
  const top = liquid[0];
  const thinN = good.length - liquid.length;

  const Table = ({ list }: { list: Row[] }) => (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, textAlign: "left" }}>시장</th>
            <th style={S.th}>하루 거래량</th>
            <th style={S.th}>설정값</th>
            <th style={S.th}>총 펀딩</th>
            <th style={S.th}>진짜 프리미엄</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr><td colSpan={5} style={{ ...S.td, textAlign: "left", color: FAINT }}>없음</td></tr>
          )}
          {list.map((r) => (
            <tr key={r.market}>
              <td style={{ ...S.td, textAlign: "left", fontWeight: 550 }}>
                {r.market}
                <span style={S.kind}>{r.pinned > 30 ? "크립토" : "실물자산"}</span>
              </td>
              <td style={{ ...S.td, color: FAINT }}>
                ${money(r.vol)}
                {r.vol < THIN_USD && <span style={S.kind}>얇음</span>}
              </td>
              <td style={{ ...S.td, color: FAINT }}>{r.pinned.toFixed(0)}%</td>
              <td style={{ ...S.td, color: MID }}>{r.total >= 0 ? "+" : ""}{r.total.toFixed(2)}%</td>
              <td style={{ ...S.td, color: r.premium > 0 ? UP : r.premium < 0 ? DN : MID, fontWeight: 650 }}>
                {r.premium >= 0 ? "+" : ""}{r.premium.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>펀딩 성분 보기</h1>
      <p style={S.sub}>
        퍼프 거래소가 주는 펀딩은 두 조각으로 되어 있습니다. 하나는 <b>거래소가 정해놓은 기본 이자율</b>이고,
        다른 하나는 <b>시장이 만든 프리미엄</b>입니다. 기본 이자율은 8시간마다 0.01%(연 10.95%)로 고정된
        설정값이라 거래소가 내일 바꿀 수 있습니다. 시장의 힘이라고 부를 수 있는 건 프리미엄 쪽뿐입니다.
        <br /><br />
        아래 <b>설정값</b> 칸이 높을수록 그 시장의 펀딩은 설정값에 붙박여 있다는 뜻입니다. 100%에 가까우면
        총 펀딩이 아무리 커 보여도 거기엔 시장의 수요가 거의 없습니다.
      </p>

      {top && (
        <div style={S.hero}>
          <div style={S.heroLab}>진짜 프리미엄이 제일 큰 곳</div>
          <div style={{ ...S.heroNum, color: UP }}>+{top.premium.toFixed(1)}%</div>
          <div style={S.heroSub}>
            <b>{top.market}</b> · 연 환산 · 하루 거래량 ${money(top.vol)}
            <br />
            총 펀딩 {top.total >= 0 ? "+" : ""}{top.total.toFixed(2)}%에서 설정값을 뺀 값입니다.
            이 시장은 펀딩의 {(100 - top.pinned).toFixed(0)}%가 시장에서 나옵니다.
            <br />
            하루 거래량 ${money(THIN_USD)} 미만은 대문에 올리지 않습니다
            {thinN > 0 && ` (지금 ${thinN}곳이 걸러졌습니다)`}.
          </div>
        </div>
      )}

      <h2 style={S.h2}>숏이 받는 쪽 · {good.length}곳</h2>
      <Table list={good} />

      <h2 style={S.h2}>롱이 받는 쪽 · {bad.length}곳</h2>
      <Table list={bad} />

      <h2 style={S.h2}>전체 · {rows.length}곳</h2>
      <Table list={rows} />

      <div style={S.note}>
        {at} 기준 · Arcus 거래량 상위 {TOP_N}개 시장 · 시장마다 최근 1,000시간 표본
        <br /><br />
        이 화면은 사라거나 팔라고 말하지 않습니다. 지금 값이 어디인지만 보여줍니다.
        저는 라이선스 있는 투자 자문가가 아니고, 이건 공개된 숫자를 성분으로 나눠본 기록입니다.
        <br /><br />
        얇은 시장은 프리미엄이 커도 쓰기 어렵습니다. 하루 거래량 ${money(THIN_USD)} 미만은 <b>얇음</b>으로
        표시했고, 들어가고 나올 때 가격이 밀려서 그 프리미엄을 다 가져가지 못합니다.
        <br /><br />
        못 보는 것: 프리미엄이 앞으로 어디로 갈지. 표본은 최근 1,000시간이고 그동안 시장은 대체로
        한 방향이었습니다. 내리는 장에서 부호가 뒤집힌 구간이 표본에 거의 없습니다.
        <br /><br />
        색은 눈으로 고르지 않았습니다. 적록색맹에서 초록과 빨강은 거의 같게 보여서 주황(숏이 받음)과
        파랑(롱이 받음)으로 갈랐습니다.
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 800, margin: "0 auto", padding: "48px 18px 90px" },
  h1: { fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" },
  h2: { fontSize: 15, fontWeight: 650, margin: "34px 0 10px" },
  sub: { fontSize: 14, color: MID, lineHeight: 1.75, margin: "0 0 24px" },
  dim: { color: FAINT, fontSize: 14 },
  warn: { border: `1px solid ${LINE}`, borderRadius: 10, padding: 16, fontSize: 14, color: MID },
  hero: { border: `1px solid ${LINE}`, borderRadius: 14, padding: "20px 22px", background: "#fcfcfb" },
  heroLab: { fontSize: 12, color: FAINT },
  heroNum: { fontSize: 44, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, margin: "4px 0 8px" },
  heroSub: { fontSize: 13, color: MID, lineHeight: 1.7 },
  tableWrap: { border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { fontSize: 11.5, fontWeight: 600, color: FAINT, textAlign: "right",
        padding: "10px 12px", borderBottom: `1px solid ${LINE}`, whiteSpace: "nowrap" },
  td: { padding: "11px 12px", borderBottom: `1px solid #f3f4f6`, textAlign: "right",
        whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" },
  kind: { fontSize: 11, color: FAINT, marginLeft: 7, fontWeight: 400 },
  note: { marginTop: 40, paddingTop: 22, borderTop: `1px solid ${LINE}`,
          fontSize: 12.5, color: MID, lineHeight: 1.9 },
};
