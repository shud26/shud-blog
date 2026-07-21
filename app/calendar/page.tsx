import fs from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캘린더 — shud.log",
  description: "한 달 스프린트 공개 캘린더. 사람과 AI가 같이 적는 할 일 목록.",
};

type Entry = { month: number; day: number; author: "S" | "C"; done: boolean; text: string };

function loadEntries(): Entry[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "content/calendar.txt"), "utf-8");
  const entries: Entry[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split("|").map((s) => s.trim());
    if (parts.length < 3) continue;
    const md = parts[0].split("/");
    const month = parseInt(md[0], 10);
    const day = parseInt(md[1], 10);
    if (!month || !day) continue;
    const author = parts[1].toUpperCase() === "S" ? "S" : "C";
    let text = parts.slice(2).join(" | ");
    const done = text.startsWith("[x]") || text.startsWith("[X]");
    if (done) text = text.slice(3).trim();
    entries.push({ month, day, author, done, text });
  }
  return entries;
}

const AUTHOR_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  S: { bg: "#fef3c7", fg: "#92400e", label: "shud" },
  C: { bg: "#dbeafe", fg: "#1e40af", label: "claude" },
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
function firstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

const YEAR = 2026;

function MonthGrid({ month, entries }: { month: number; entries: Entry[] }) {
  const total = daysInMonth(YEAR, month);
  const offset = firstWeekday(YEAR, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  const byDay = new Map<number, Entry[]>();
  for (const e of entries) {
    if (e.month !== month) continue;
    byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  }
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontWeight: 700, margin: "0 0 0.6rem", fontSize: "1rem" }}>{YEAR}년 {month}월</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: "0.7rem", color: i === 0 ? "#dc2626" : "#9ca3af", padding: "0.2rem 0" }}>{w}</div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={`e${i}`} />
          ) : (
            <div
              key={d}
              data-cal-date={`${month}/${d}`}
              style={{ border: "1px solid #e5e7eb", borderRadius: 4, minHeight: 44, padding: "0.2rem 0.25rem", background: "#fff" }}
            >
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{d}</div>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 2 }}>
                {(byDay.get(d) ?? []).map((e, j) => (
                  <span
                    key={j}
                    title={`${AUTHOR_STYLE[e.author].label}: ${e.text}`}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 2,
                      display: "inline-block",
                      background: e.done ? "#9ca3af" : e.author === "S" ? "#f59e0b" : "#3b82f6",
                    }}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const entries = loadEntries();
  const months = [...new Set(entries.map((e) => e.month))].sort((a, b) => a - b);
  const byDate = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = `${e.month}/${e.day}`;
    byDate.set(k, [...(byDate.get(k) ?? []), e]);
  }
  const dates = [...byDate.keys()].sort((a, b) => {
    const [am, ad] = a.split("/").map(Number);
    const [bm, bd] = b.split("/").map(Number);
    return am - bm || ad - bd;
  });
  const doneCount = entries.filter((e) => e.done).length;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.4rem" }}>캘린더</h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 0.8rem", lineHeight: 1.7 }}>
        한 달 스프린트의 공개 할 일 목록. 사람(<span style={{ background: AUTHOR_STYLE.S.bg, color: AUTHOR_STYLE.S.fg, padding: "0 0.35rem", borderRadius: 3 }}>shud</span>)과
        AI(<span style={{ background: AUTHOR_STYLE.C.bg, color: AUTHOR_STYLE.C.fg, padding: "0 0.35rem", borderRadius: 3 }}>claude</span>)가
        같이 적습니다. 진행률 {doneCount}/{entries.length}.
      </p>
      {months.map((m) => (
        <MonthGrid key={m} month={m} entries={entries} />
      ))}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.2rem" }}>
        {dates.map((k) => (
          <div key={k} data-cal-date={k} style={{ display: "flex", gap: "0.8rem", padding: "0.45rem 0.3rem", borderBottom: "1px dashed #f3f4f6", alignItems: "baseline" }}>
            <div style={{ minWidth: 44, fontWeight: 600, fontSize: "0.85rem", color: "#374151" }}>{k}</div>
            <div style={{ flex: 1 }}>
              {(byDate.get(k) ?? []).map((e, j) => (
                <div key={j} style={{ fontSize: "0.9rem", lineHeight: 1.9, color: e.done ? "#9ca3af" : "#111", textDecoration: e.done ? "line-through" : "none" }}>
                  <span style={{ background: AUTHOR_STYLE[e.author].bg, color: AUTHOR_STYLE[e.author].fg, fontSize: "0.7rem", padding: "0.05rem 0.35rem", borderRadius: 3, marginRight: "0.5rem", verticalAlign: "1px" }}>
                    {AUTHOR_STYLE[e.author].label}
                  </span>
                  {e.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var n=new Date();var k=(n.getMonth()+1)+"/"+n.getDate();document.querySelectorAll('[data-cal-date="'+k+'"]').forEach(function(el){el.style.background="#fffbeb";el.style.borderColor="#f59e0b";});})();`,
        }}
      />
    </div>
  );
}
