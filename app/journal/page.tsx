import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매매일지 — shud.log",
  description: "하루 3분 국장 매매일지. 지표는 수익이 아니라 계획 위반률.",
};

export const dynamic = "force-dynamic";

type Entry = {
  date: string;
  strategy_tag: string;
  market_regime: string;
  plan: string;
  conviction: number;
  plan_followed: boolean;
  pnl_realized: number;
  mistake_tag: string;
  emotion: string;
  body: string;
};

const DIR = path.join(process.cwd(), "content/journal");

function toDateStr(v: unknown, fallback: string): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string" && v) return v;
  return fallback;
}

function loadEntries(): Entry[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(DIR, f), "utf-8"));
      return {
        date: toDateStr(data.date, f.replace(/\.md$/, "")),
        strategy_tag: String(data.strategy_tag ?? "기타"),
        market_regime: String(data.market_regime ?? ""),
        plan: String(data.plan ?? ""),
        conviction: Number(data.conviction ?? 0),
        plan_followed: String(data.plan_followed ?? "Y").toUpperCase() !== "N",
        pnl_realized: Number(data.pnl_realized ?? 0),
        mistake_tag: String(data.mistake_tag ?? "없음"),
        emotion: String(data.emotion ?? ""),
        body: content.trim(),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* 템플릿이 쓰는 마크다운 부분집합만 렌더: ## 제목 / | 표 | / - 리스트 / 문단 */
function renderBody(body: string) {
  const blocks: React.ReactNode[] = [];
  const lines = body.split("\n");
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h4 key={k++} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6b7280", margin: "0.9rem 0 0.3rem", letterSpacing: "0.02em" }}>
          {line.slice(3)}
        </h4>
      );
      i++;
    } else if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().split("|").slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^[-: ]*$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length > 0)
        blocks.push(
          <div key={k++} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "0.82rem", margin: "0.2rem 0" }}>
              <thead>
                <tr>
                  {rows[0].map((c, ci) => (
                    <th key={ci} style={{ border: "1px solid #e5e7eb", padding: "0.25rem 0.6rem", background: "#f9fafb", fontWeight: 600, textAlign: "left" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} style={{ border: "1px solid #e5e7eb", padding: "0.25rem 0.6rem" }}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(
        <ul key={k++} style={{ margin: "0.2rem 0", paddingLeft: "1.1rem" }}>
          {items.map((it, ii) => (
            <li key={ii} style={{ fontSize: "0.88rem", lineHeight: 1.7 }}>{it}</li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <p key={k++} style={{ fontSize: "0.88rem", margin: "0.2rem 0", lineHeight: 1.7 }}>{line}</p>
      );
      i++;
    }
  }
  return blocks;
}

const chip = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  padding: "0.1rem 0.5rem",
  borderRadius: 4,
  fontSize: "0.75rem",
  fontWeight: 600,
});

export default function JournalPage() {
  const entries = loadEntries();
  const followed = entries.filter((e) => e.plan_followed).length;
  const followPct = entries.length ? Math.round((followed / entries.length) * 100) : 100;
  const mistakes = entries.filter((e) => e.mistake_tag && e.mistake_tag !== "없음").length;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.4rem" }}>매매일지</h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 0.9rem", lineHeight: 1.7 }}>
        하루 3분 국장 기록. 여기서 지표는 수익이 아니라 <b style={{ color: "#111" }}>계획 위반률</b>입니다 —
        실력이 는다 = 계획을 어기는 날이 줄어든다.
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.78rem", color: "#6b7280", marginBottom: "1.2rem", lineHeight: 1.6 }}>
        개인 학습 기록입니다. 특정 종목의 추천·매수/매도 권유·투자 자문이 아니며, 모든 투자 판단과 책임은 각자에게 있습니다.
      </div>

      {/* 스탯 */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.4rem" }}>
        <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem", color: "#374151" }}>
          기록 <b style={{ color: "#111" }}>{entries.length}</b>일
        </span>
        <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem", color: "#374151" }}>
          계획 준수율 <b style={{ color: followPct >= 80 ? "#15803d" : "#dc2626" }}>{followPct}%</b>
        </span>
        <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem", color: "#374151" }}>
          실수 기록 <b style={{ color: "#111" }}>{mistakes}</b>회
        </span>
      </div>

      {entries.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>아직 기록이 없습니다.</p>
      )}

      {entries.map((e) => (
        <article key={e.date} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
            <b style={{ fontSize: "0.95rem" }}>{e.date}</b>
            <span style={chip("#eef2ff", "#3730a3")}>{e.strategy_tag}</span>
            {e.market_regime && <span style={chip("#f3f4f6", "#4b5563")}>{e.market_regime}</span>}
            {e.plan_followed ? (
              <span style={chip("#dcfce7", "#15803d")}>계획 준수</span>
            ) : (
              <span style={chip("#fee2e2", "#b91c1c")}>계획 이탈</span>
            )}
            {e.mistake_tag && e.mistake_tag !== "없음" && <span style={chip("#fef3c7", "#92400e")}>{e.mistake_tag}</span>}
            {e.emotion && <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{e.emotion}</span>}
          </div>
          {e.plan && (
            <p style={{ fontSize: "0.88rem", margin: "0 0 0.3rem", color: "#374151" }}>
              <b style={{ color: "#6b7280", fontSize: "0.78rem" }}>계획</b> {e.plan}
            </p>
          )}
          {renderBody(e.body)}
        </article>
      ))}
    </div>
  );
}
