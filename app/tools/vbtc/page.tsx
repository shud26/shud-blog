"use client";

import { useState, useEffect } from "react";

/**
 * 비트코인 규칙 확인 화면 — 아침에 한 번 열어보는 용도.
 *
 * ⚠️ 어려운 말을 쓰지 않는다. 2026-08-27에 초안이 "이격도·MA20·확정봉·1차 청산"
 *    같은 말로 도배돼서 못 읽겠다는 피드백을 받았다. 숫자마다 그게 무슨 뜻인지
 *    한 문장씩 붙인다. 화면을 보는 사람은 나 하나고, 나는 아침에 졸린 상태다.
 *
 * ⚠️ 이 페이지는 봇의 상태가 아니라 규칙을 다시 계산한 것이다.
 * ⚠️ 잔고·손익 금액은 올리지 않는다. 공개 페이지다.
 */

const DAYS = 20;   // 평균을 낼 기간
const SELL_HALF = 14;  // 평균보다 이만큼 비싸지면 절반
const SELL_ALL = 22;   // 이만큼이면 전부

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
        if (!r.ok) throw new Error(`시세 서버 응답 ${r.status}`);
        const ks = await r.json();
        // 오늘 봉은 아직 안 끝났으니 버린다 (봇과 같은 규칙)
        setBars(
          ks.slice(0, -1).map((k: (string | number)[]) => ({
            date: new Date(Number(k[0])).toISOString().slice(0, 10),
            close: Number(k[4]),
          }))
        );
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return <main style={S.wrap}><p style={S.dim}>시세 받는 중…</p></main>;

  if (err || bars.length < DAYS + 2)
    return (
      <main style={S.wrap}>
        <h1 style={S.h1}>비트코인 규칙 확인</h1>
        <div style={S.warn}>
          <b>시세를 못 받았습니다.</b> ({err || "데이터 부족"})<br />
          이 화면으로 판단하지 마세요. 모르는 것과 괜찮은 것은 다릅니다.
        </div>
      </main>
    );

  const closes = bars.map((b) => b.close);
  const today = bars[bars.length - 1];
  const avg = closes.slice(-DAYS).reduce((a, b) => a + b, 0) / DAYS;
  const avgPrev = closes.slice(-DAYS - 1, -1).reduce((a, b) => a + b, 0) / DAYS;
  const pct = (today.close / avg - 1) * 100;      // 평균보다 몇 % 비싼가
  const justCrossedUp = today.close > avg && closes[closes.length - 2] <= avgPrev;

  const pxHalf = avg * (1 + SELL_HALF / 100);
  const pxAll = avg * (1 + SELL_ALL / 100);

  // 가격이 그대로일 때 평균이 며칠 뒤 따라오나
  let w = closes.slice(-(DAYS - 1));
  let meetDay = 0;
  for (let d = 1; d <= 25; d++) {
    w = [...w, today.close].slice(-DAYS);
    const m = w.reduce((a, b) => a + b, 0) / DAYS;
    if (Math.abs(today.close / m - 1) * 100 < 2) { meetDay = d; break; }
  }

  // 오늘 한 줄 요약
  // ⚠️ 이 화면은 내가 지금 갖고 있는지 모른다(봇 데이터가 없다).
  //    그래서 "파세요"라고 단정하지 않고 **갖고 있을 때 / 없을 때**를 나눠서 말한다.
  //    2026-08-27 초안이 무포지션인데 "절반 팝니다"라고 띄워서 고쳤다.
  const verdict = justCrossedUp
    ? { emoji: "🟢", head: "사는 날입니다",
        body: "가격이 평균 위로 막 올라섰습니다. 규칙상 오늘이 사는 날입니다." }
    : pct >= SELL_ALL
    ? { emoji: "🔴", head: "많이 비싼 구간입니다",
        have: `평균보다 ${pct.toFixed(0)}% 비쌉니다. 갖고 있다면 전부 파는 자리입니다.`,
        none: "갖고 있는 게 없다면, 여기서는 사지 않습니다. 너무 올랐습니다." }
    : pct >= SELL_HALF
    ? { emoji: "🟠", head: "비싼 구간입니다",
        have: `평균보다 ${pct.toFixed(0)}% 비쌉니다. 갖고 있다면 절반 파는 자리입니다.`,
        none: "갖고 있는 게 없다면, 오늘은 아무것도 안 합니다. 여기서 사는 규칙은 없습니다." }
    : pct > 0
    ? { emoji: "⚪", head: "오늘은 아무것도 안 합니다",
        body: `평균보다 ${pct.toFixed(1)}% 비싼 상태입니다. 사기엔 이미 올랐고, 팔 만큼 오른 것도 아닙니다.` }
    : { emoji: "⚪", head: "오늘은 아무것도 안 합니다",
        body: `평균보다 ${Math.abs(pct).toFixed(1)}% 쌉니다. 평균 위로 올라설 때까지 기다립니다.` };

  // 눈금: 평균 ~ 다팔기 사이 어디쯤인가
  const lo = avg * 0.95, hi = pxAll * 1.03;
  const posOf = (p: number) => Math.max(2, Math.min(98, ((p - lo) / (hi - lo)) * 100));

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>비트코인 규칙 확인</h1>
      <p style={S.sub}>{today.date} 마감 가격 기준 · 아침에 한 번 보는 화면</p>

      {/* 오늘 뭐 하나 */}
      <div style={S.hero}>
        <div style={S.heroHead}>
          <span style={{ fontSize: 26, marginRight: 10 }}>{verdict.emoji}</span>
          {verdict.head}
        </div>
        {verdict.body ? (
          <div style={S.heroBody}>{verdict.body}</div>
        ) : (
          <div style={S.heroSplit}>
            <div style={S.heroCase}>
              <span style={S.caseTag}>갖고 있으면</span>
              {verdict.have}
            </div>
            <div style={S.heroCase}>
              <span style={{ ...S.caseTag, background: "#f3f4f6", color: "#6b7280" }}>없으면</span>
              {verdict.none}
            </div>
          </div>
        )}
      </div>

      {/* 눈금 */}
      <div style={S.gauge}>
        <svg viewBox="0 0 340 84" width="100%" role="img"
             aria-label="지금 가격이 평균과 파는 가격 사이 어디쯤인지 보여주는 눈금">
          <line x1="10" y1="46" x2="330" y2="46" stroke="#e5e7eb" strokeWidth="3" />
          {[
            { p: avg, label: "평균", c: "#6b7280" },
            { p: pxHalf, label: "절반 팔기", c: "#b45309" },
            { p: pxAll, label: "다 팔기", c: "#c02626" },
          ].map((m) => (
            <g key={m.label}>
              <line x1={10 + posOf(m.p) * 3.2} y1="38" x2={10 + posOf(m.p) * 3.2} y2="54"
                    stroke={m.c} strokeWidth="2" />
              <text x={10 + posOf(m.p) * 3.2} y="70" fontSize="9" fill={m.c} textAnchor="middle">
                {m.label}
              </text>
              <text x={10 + posOf(m.p) * 3.2} y="80" fontSize="8.5" fill="#9ca3af" textAnchor="middle">
                ${Math.round(m.p).toLocaleString()}
              </text>
            </g>
          ))}
          <circle cx={10 + posOf(today.close) * 3.2} cy="46" r="7" fill="#111827" />
          <text x={10 + posOf(today.close) * 3.2} y="24" fontSize="10" fontWeight="700"
                fill="#111827" textAnchor="middle">
            지금 ${Math.round(today.close).toLocaleString()}
          </text>
        </svg>
      </div>

      {/* 규칙 세 줄 */}
      <h2 style={S.h2}>규칙은 딱 세 줄입니다</h2>
      <div style={S.rules}>
        <RuleCard
          n="1" on={justCrossedUp}
          title="언제 사나"
          plain="비트코인 가격이 최근 20일 평균보다 싸다가, 다시 평균 위로 올라선 날에 삽니다."
          now={
            justCrossedUp
              ? "오늘이 그날입니다."
              : pct > 0
              ? `지금은 평균($${Math.round(avg).toLocaleString()})보다 위에 있어서 안 삽니다. 한 번 평균 아래로 내려갔다 올라와야 합니다.`
              : `지금은 평균 아래입니다. 평균($${Math.round(avg).toLocaleString()})을 위로 넘어서면 삽니다.`
          }
        />
        <RuleCard
          n="2" on={pct >= SELL_HALF && pct < SELL_ALL}
          title="언제 절반 파나"
          plain={`평균보다 ${SELL_HALF}% 비싸지면 갖고 있는 것의 절반을 팝니다.`}
          now={`지금 기준으로 $${Math.round(pxHalf).toLocaleString()}을 넘으면 그때입니다.`}
        />
        <RuleCard
          n="3" on={pct >= SELL_ALL || today.close < avg}
          title="언제 나머지 파나"
          plain={`평균보다 ${SELL_ALL}% 비싸지거나(더 못 오를 만큼 올랐다), 반대로 평균 아래로 떨어지면(오름세가 끝났다) 나머지를 팝니다.`}
          now={`지금 기준으로 $${Math.round(pxAll).toLocaleString()} 위 또는 $${Math.round(avg).toLocaleString()} 아래입니다.`}
        />
      </div>

      {!justCrossedUp && pct > 0 && meetDay > 0 && (
        <>
          <h2 style={S.h2}>그럼 언제쯤 살 수 있나</h2>
          <p style={S.p}>
            지금은 가격이 평균보다 <b>{pct.toFixed(1)}% 위</b>에 떠 있습니다. 사려면 둘 중 하나가
            일어나야 합니다.
          </p>
          <ul style={S.ul}>
            <li>가격이 <b>${Math.round(avg).toLocaleString()}</b>까지 내려갔다가 다시 올라오거나</li>
            <li>가격은 그대로인데 <b>평균이 올라와서</b> 가격을 따라잡거나</li>
          </ul>
          <p style={S.p}>
            평균은 최근 20일 값으로 계산하니까, 옛날 싼 가격이 하나씩 빠지면서 계속 올라옵니다.
            지금 가격이 그대로 있으면 <b>약 {meetDay}일 뒤</b>에 둘이 만납니다.
          </p>
          <p style={S.note}>
            물론 가격이 그대로 있을 리는 없습니다. 이건 예측이 아니라 <b>&ldquo;대충 이 정도 기다리는 거구나&rdquo;</b>를
            보려는 계산입니다.
          </p>
        </>
      )}

      <h2 style={S.h2}>왜 절반씩 파나</h2>
      <p style={S.p}>
        전부 팔면 그 뒤에 더 오를 때 아쉽고, 안 팔면 떨어질 때 아깝습니다.
        절반만 팔면 <b>어느 쪽이 나와도 절반은 맞은 게 됩니다.</b> 더 벌려고 만든 규칙이 아니라,
        판 다음에 후회할 자리를 없애려고 만든 규칙입니다.
      </p>

      <h2 style={S.h2}>이 화면을 너무 믿지는 말 것</h2>
      <ul style={S.ul}>
        <li>
          <b>이건 봇이 뭘 했는지 보여주는 화면이 아닙니다.</b> 규칙을 다시 계산해서 보여줄 뿐입니다.
          실제로 사고팔았는지는 텔레그램으로 옵니다. <b>둘이 안 맞으면 뭔가 고장난 겁니다.</b>
        </li>
        <li>
          <b>남에게 사라 팔라는 얘기가 아닙니다.</b> 제가 저 보려고 미리 적어둔 규칙이고,
          저는 투자 자문가가 아닙니다.
        </li>
        <li>
          <b>이 규칙에는 손절이 없습니다.</b> 크게 떨어져도 안 팝니다. 과거 9년으로 확인해보니
          제일 나빴을 때가 반토막이었습니다. 그걸 알고 고른 규칙이라 <b>적은 돈으로만</b> 굴립니다.
        </li>
      </ul>

      <p style={S.foot}>
        <a href="/posts/measure-your-own-trades-0827" style={S.a}>
          이 규칙을 어떻게 만들었는지 쓴 글 →
        </a>
      </p>
    </main>
  );
}

function RuleCard({ n, on, title, plain, now }:
  { n: string; on: boolean; title: string; plain: string; now: string }) {
  return (
    <div style={{ ...S.rule, ...(on ? S.ruleOn : {}) }}>
      <div style={S.ruleHead}>
        <span style={{ ...S.ruleNum, ...(on ? S.ruleNumOn : {}) }}>{n}</span>
        {title}
        {on && <span style={S.badge}>지금 여기</span>}
      </div>
      <div style={S.rulePlain}>{plain}</div>
      <div style={S.ruleNow}>{now}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" },
  h1: { fontSize: 23, margin: "0 0 4px", letterSpacing: "-0.02em" },
  h2: { fontSize: 16, margin: "34px 0 10px", letterSpacing: "-0.01em" },
  sub: { color: "#6b7280", fontSize: 13, margin: "0 0 22px" },
  p: { fontSize: 14.5, lineHeight: 1.85, margin: "0 0 12px" },
  note: { fontSize: 13, lineHeight: 1.8, color: "#6b7280" },
  dim: { color: "#6b7280", fontSize: 14 },
  warn: { border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b",
          borderRadius: 10, padding: "16px 18px", fontSize: 14, lineHeight: 1.8 },
  hero: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", marginBottom: 18 },
  heroHead: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8,
              display: "flex", alignItems: "center" },
  heroBody: { fontSize: 14.5, lineHeight: 1.8, color: "#374151" },
  heroSplit: { display: "flex", flexDirection: "column", gap: 10 },
  heroCase: { fontSize: 14, lineHeight: 1.8, color: "#374151" },
  caseTag: { display: "inline-block", fontSize: 11, fontWeight: 700, color: "#b45309",
             background: "#fffbeb", borderRadius: 4, padding: "1px 7px", marginRight: 7 },
  gauge: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 10px 6px", marginBottom: 6 },
  rules: { display: "flex", flexDirection: "column", gap: 10 },
  rule: { border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" },
  ruleOn: { borderColor: "#0f7b3d", background: "#f0fdf4" },
  ruleHead: { fontSize: 15, fontWeight: 700, marginBottom: 8, display: "flex",
              alignItems: "center", gap: 8, flexWrap: "wrap" },
  ruleNum: { display: "inline-flex", alignItems: "center", justifyContent: "center",
             width: 22, height: 22, borderRadius: 11, background: "#f3f4f6",
             color: "#6b7280", fontSize: 12, fontWeight: 700 },
  ruleNumOn: { background: "#0f7b3d", color: "#fff" },
  badge: { fontSize: 11, fontWeight: 600, color: "#0f7b3d", border: "1px solid #bbf7d0",
           background: "#fff", borderRadius: 20, padding: "1px 8px" },
  rulePlain: { fontSize: 14, lineHeight: 1.8, marginBottom: 6 },
  ruleNow: { fontSize: 13, lineHeight: 1.75, color: "#6b7280" },
  ul: { fontSize: 14.5, lineHeight: 1.9, color: "#374151", paddingLeft: 20, margin: "0 0 12px" },
  foot: { marginTop: 40, fontSize: 13 },
  a: { color: "#2563eb" },
};
