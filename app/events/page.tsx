import data from "@/content/events.json";

// 2026-10-08: 앞으로 4주 '날짜가 정해진' 코인 일정. 사건만 적는다.
// ⚠️ 오른다/내린다 같은 예측·추천은 이 페이지에 절대 넣지 않는다(유사투자자문 표현 금지).
//    형의 찍기·채점은 비공개 작업판에서만 한다.
export const metadata = {
  title: "코인 일정판 — shud.log",
  description: "앞으로 4주 동안 날짜가 정해진 코인 일정. 토큰 언락, 투표, 업그레이드, 미국 지표.",
};

type Conf = "official" | "media" | "weak";
interface Ev { date: string; time?: string; tk: string; cat: string; title: string; desc: string; conf: Conf; src: string }

const CAT: Record<string, { label: string; color: string }> = {
  unlock: { label: "토큰 풀림", color: "#e8890c" },
  gov: { label: "투표", color: "#8b5cf6" },
  upgrade: { label: "업그레이드", color: "#3182f6" },
  macro: { label: "미국 지표", color: "#191f28" },
  supply: { label: "소각", color: "#03a65f" },
  tge: { label: "에어드랍", color: "#0e9aa7" },
};
const CONF: Record<Conf, string> = { official: "공식 일정", media: "언론 보도", weak: "날짜 불확실" };
const WD = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 문자열을 UTC 자정으로만 다룬다(빌드 서버 시간대에 따라 하루 밀리는 걸 막기 위해)
const utc = (d: string) => new Date(d + "T00:00:00Z");
function weekKey(d: string) {
  const t = utc(d);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}
function md(d: string) {
  const t = utc(d);
  return `${t.getUTCMonth() + 1}/${t.getUTCDate()}`;
}
function wd(d: string) {
  return WD[utc(d).getUTCDay()];
}

function Row({ e }: { e: Ev }) {
  const c = CAT[e.cat] ?? { label: e.cat, color: "#8b95a1" };
  return (
    <li className="ev">
      <div className="ev-day">
        <b>{md(e.date)}</b>
        <span>{wd(e.date)}{e.time ? ` ${e.time}` : ""}</span>
      </div>
      <div className="ev-body">
        <div className="ev-top">
          <span className="ev-tk">{e.tk}</span>
          <span className="ev-cat" style={{ color: c.color, borderColor: c.color }}>{c.label}</span>
          <span className={`ev-conf ${e.conf}`}>{CONF[e.conf]}</span>
        </div>
        <div className="ev-t">{e.title}</div>
        <p className="ev-d">{e.desc} <a href={e.src} target="_blank" rel="noopener noreferrer">출처</a></p>
      </div>
    </li>
  );
}

export default function EventsPage() {
  const events = (data.events as Ev[]).slice().sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  const weeks = new Map<string, Ev[]>();
  for (const e of events) {
    const k = weekKey(e.date);
    weeks.set(k, [...(weeks.get(k) ?? []), e]);
  }
  return (
    <div className="toc evs">
      <div>
        <h1>코인 일정판</h1>
        <p className="lead">앞으로 4주({data.range}) 동안 날짜가 정해진 일만 모았다. 시각은 한국 시간.</p>
        <p className="ev-note">업데이트 {data.updated} · 일정만 적는다. 오를지 내릴지는 적지 않는다. 투자 권유 아님.</p>
      </div>

      {[...weeks.entries()].map(([k, list]) => (
        <section key={k}>
          <div className="grp-h"><h2>{md(k)} 주</h2><span>{list.length}건</span></div>
          <ul className="ev-list">{list.map((e, i) => <Row key={i} e={e} />)}</ul>
        </section>
      ))}

      <section>
        <div className="grp-h"><h2>날짜 미정</h2><span>{data.undated.length}건</span></div>
        <ul className="ev-list">
          {data.undated.map((u, i) => {
            const c = CAT[u.cat];
            return (
              <li className="ev" key={i}>
                <div className="ev-day"><b className="sm">{u.when}</b></div>
                <div className="ev-body">
                  <div className="ev-top">
                    <span className="ev-tk">{u.tk}</span>
                    <span className="ev-cat" style={{ color: c.color, borderColor: c.color }}>{c.label}</span>
                    <span className={`ev-conf ${u.conf}`}>{CONF[u.conf as Conf]}</span>
                  </div>
                  <div className="ev-t">{u.title}</div>
                  <p className="ev-d">{u.desc} <a href={u.src} target="_blank" rel="noopener noreferrer">출처</a></p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="grp-h"><h2>최근 지나간 일</h2></div>
        <ul className="ev-list">
          {data.past.map((p, i) => (
            <li className="ev past" key={i}>
              <div className="ev-day"><b>{md(p.date)}</b><span>{wd(p.date)}</span></div>
              <div className="ev-body">
                <div className="ev-top"><span className="ev-tk">{p.tk}</span></div>
                <div className="ev-t">{p.title}</div>
                <p className="ev-d">{p.desc} <a href={p.src} target="_blank" rel="noopener noreferrer">출처</a></p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
