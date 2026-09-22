"use client";

import { useEffect, useState } from "react";

/**
 * 내가 찍은 것들의 채점 기록.
 *
 * ⚠️ **추천이 아니라 기록이다.** 30일이 지나 결과가 확정된 것만 올린다.
 *    진행 중인 판단은 올리지 않는다 — 그건 리딩으로 읽힌다.
 *
 * ⚠️ 데이터는 맥미니가 만들고(`publish.py`) 확정분만 추려서 여기 온다.
 *    진행 중인 것은 애초에 파일에 들어오지 않는다.
 */

const UP = "#c4620a";
const INK = "#111111";
const MID = "#6b7280";
const FAINT = "#9ca3af";
const LINE = "#e5e7eb";

type Row = {
  name: string; symbol?: string | null; kind: string; metric?: string; track?: string;
  date: string; why?: string | null; conf?: string | null;
  best?: number | null; result: string; result90?: string | null;
};
type Pub = {
  at: string; window_days: number; win_pct: number;
  total_events: number; closed: number; picked: number; hits: number;
  baseline?: number | null;
  by_kind: Record<string, { n: number; hit: number }>;
  by_why: Record<string, { n: number; hit: number }>;
  by_conf: Record<string, { n: number; hit: number }>;
  w90: { closed: number; picked: number; hits: number };
  rows: Row[];
};

export default function Page() {
  const [d, setD] = useState<Pub | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/data/eye.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setD)
      .catch((e) => setErr(`기록을 못 읽었습니다 (${e.message})`));
  }, []);

  if (err) return <main style={S.wrap}><h1 style={S.h1}>채점 기록</h1><div style={S.warn}>{err}</div></main>;
  if (!d) return <main style={S.wrap}><p style={S.dim}>불러오는 중…</p></main>;

  const rate = d.picked ? (d.hits / d.picked) * 100 : null;
  const base = d.baseline != null ? d.baseline * 100 : null;
  const edge = rate != null && base != null ? rate - base : null;

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>채점 기록</h1>
      <p style={S.sub}>
        온체인에서 돈이 몰리는 곳을 보고 <b>“여긴 뭔가 있다”</b> 싶은 것을 골라 적어둔 뒤,
        <b> {d.window_days}일이 지나면 맞았는지 자동으로 채점</b>합니다. 맞히려는 게 아니라
        <b> 내 판단이 쓸만한지 재보려는</b> 기록입니다.
        <br />
        <span style={{ color: FAINT }}>
          결과가 확정된 것만 올립니다. 진행 중인 판단은 올리지 않습니다.
        </span>
      </p>

      {d.picked === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 17, fontWeight: 650, color: INK, marginBottom: 8 }}>
            아직 확정된 기록이 없습니다
          </div>
          지금 {d.total_events}건을 지켜보는 중이고, 첫 결과는 {d.window_days}일 뒤에 나옵니다.
          <br />그때부터 이 자리에 하나씩 쌓입니다.
        </div>
      ) : (
        <>
          <div style={S.stats}>
            <div style={S.stat}>
              <div style={S.statL}>내가 고른 것</div>
              <div style={S.statV}>{d.hits}<span style={S.statU}>/{d.picked}건 맞음</span></div>
              <div style={S.statK}>{rate!.toFixed(0)}%</div>
            </div>
            <div style={S.stat}>
              <div style={S.statL}>안 고른 것까지 전부</div>
              <div style={S.statV}>{base!.toFixed(0)}<span style={S.statU}>%</span></div>
              <div style={S.statK}>비교 기준 ({d.closed}건)</div>
            </div>
            <div style={S.stat}>
              <div style={S.statL}>차이</div>
              <div style={{ ...S.statV, color: edge! >= 0 ? UP : "#b3261e" }}>
                {edge! >= 0 ? "+" : ""}{edge!.toFixed(0)}<span style={S.statU}>%p</span>
              </div>
              <div style={S.statK}>고른 게 나았나</div>
            </div>
          </div>

          {Object.keys(d.by_why).length > 0 && (
            <>
              <h2 style={S.h2}>어떤 이유가 잘 맞았나</h2>
              <div style={S.chips}>
                {Object.entries(d.by_why).sort((a, b) => b[1].n - a[1].n).map(([w, v]) => (
                  <div key={w} style={S.chip}>
                    <b>{w}</b> {v.hit}/{v.n}
                  </div>
                ))}
              </div>
            </>
          )}

          {Object.keys(d.by_conf).length > 0 && (
            <>
              <h2 style={S.h2}>확신할수록 더 맞았나</h2>
              <div style={S.chips}>
                {["상", "중", "하"].filter((c) => d.by_conf[c]).map((c) => (
                  <div key={c} style={S.chip}>
                    <b>확신 {c}</b> {d.by_conf[c].hit}/{d.by_conf[c].n}
                  </div>
                ))}
              </div>
              <p style={S.hint}>
                맞힌 비율보다 <b>확신했을 때 더 맞았는지</b>가 진짜 실력입니다.
                다 맞히는 사람보다, 자기가 언제 틀리는지 아는 사람이 낫습니다.
              </p>
            </>
          )}

          <h2 style={S.h2}>하나씩</h2>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <tbody>
                {d.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={S.tdName}>
                      {r.name}
                      <div style={S.tdSub}>
                        <b style={{ color: INK }}>{r.kind}</b>{r.metric ? ` ${r.metric}` : ""}
                        {r.why ? ` · “${r.why}”` : ""}{r.conf ? ` · 확신 ${r.conf}` : ""}
                      </div>
                    </td>
                    <td style={S.tdDate}>{r.date}</td>
                    <td style={S.tdNum}>
                      {r.best != null && r.best > -900 ? `${r.best >= 0 ? "+" : ""}${r.best.toFixed(0)}%` : "—"}
                    </td>
                    <td style={S.tdRes}>
                      {r.result === "hit"
                        ? <span style={S.hit}>맞음</span>
                        : <span style={{ color: FAINT }}>아님</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={S.note}>
        <b>어떻게 채점하나</b><br />
        토큰이 있는 곳은 <b>{d.window_days}일 안에 최고가가 비트코인보다 {d.win_pct}% 이상 더 올랐으면</b> 맞음.
        토큰이 없는 곳은 <b>{d.window_days}일 안에 토큰이 실제로 나왔으면</b> 맞음.
        고른 시점이 아니라 <b>그 자리가 처음 눈에 띈 시점</b>부터 셉니다 — 안 그러면 늦게 고른 쪽이 유리해집니다.
        <br /><br />
        <b>왜 안 고른 것까지 세나</b><br />
        고른 것만 보면 <b>원래 그 정도는 맞는다</b>와 구분이 안 됩니다.
        그래서 눈에 띈 것 전체를 비교 기준으로 둡니다.
        <br /><br />
        <b>이 기록이 말하지 않는 것</b><br />
        언제 사고 팔지, 얼마를 넣을지는 재지 않습니다. <b>알아보는 눈</b> 하나만 봅니다.
        그리고 지난 성적이 다음을 보장하지 않습니다.
        <br /><br />
        <span style={{ color: FAINT }}>
          이 화면은 투자 판단을 돕거나 특정 종목을 권하지 않습니다.
          결과가 끝난 개인 기록이며, 진행 중인 판단은 올리지 않습니다.
          갱신 {d.at.replace("T", " ").slice(0, 16)}
        </span>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 800, margin: "0 auto", padding: "48px 18px 90px" },
  h1: { fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" },
  h2: { fontSize: 15, fontWeight: 650, margin: "34px 0 10px" },
  sub: { fontSize: 14, color: MID, lineHeight: 1.75, margin: "0 0 24px" },
  hint: { fontSize: 12.5, color: MID, lineHeight: 1.8, marginTop: 10 },
  dim: { color: FAINT, fontSize: 14 },
  warn: { border: `1px solid ${LINE}`, borderRadius: 10, padding: 16, fontSize: 14, color: MID },
  empty: { border: `1px solid ${LINE}`, borderRadius: 14, padding: "26px 22px",
           background: "#fcfcfb", fontSize: 13.5, color: MID, lineHeight: 1.8 },
  stats: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: `1px solid ${LINE}` },
  stat: { padding: "16px 14px 16px 0" },
  statL: { fontSize: 11.5, color: FAINT, marginBottom: 5 },
  statV: { fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" },
  statU: { fontSize: 12.5, color: MID, fontWeight: 400, marginLeft: 3 },
  statK: { fontSize: 11, color: FAINT, marginTop: 3 },
  chips: { display: "flex", gap: 7, flexWrap: "wrap" },
  chip: { border: `1px solid ${LINE}`, borderRadius: 999, padding: "6px 13px",
          fontSize: 12.5, color: MID },
  tableWrap: { border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  tdName: { padding: "12px", borderBottom: `1px solid ${LINE}`, fontWeight: 550, verticalAlign: "top" },
  tdSub: { fontSize: 11.5, color: FAINT, fontWeight: 400, marginTop: 3, lineHeight: 1.55 },
  tdDate: { padding: "12px 6px", borderBottom: `1px solid ${LINE}`, color: FAINT,
            fontSize: 11.5, whiteSpace: "nowrap", verticalAlign: "top" },
  tdNum: { padding: "12px 6px", borderBottom: `1px solid ${LINE}`, textAlign: "right",
           fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", verticalAlign: "top" },
  tdRes: { padding: "12px", borderBottom: `1px solid ${LINE}`, textAlign: "right",
           width: 58, verticalAlign: "top" },
  hit: { fontSize: 12, fontWeight: 650, color: UP, background: "#fdf3ea",
         padding: "3px 9px", borderRadius: 999 },
  note: { marginTop: 36, paddingTop: 22, borderTop: `1px solid ${LINE}`,
          fontSize: 12.5, color: MID, lineHeight: 1.9 },
};
