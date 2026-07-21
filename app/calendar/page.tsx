import fs from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캘린더 — shud.log",
  description: "한 달 스프린트 공개 캘린더. 사람과 AI가 같이 적는 할 일 목록.",
};

export const dynamic = "force-dynamic";

type Entry = { month: number; day: number; author: "S" | "C"; done: boolean; text: string };

const YEAR = 2026;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MILESTONES = [
  { month: 8, day: 1, label: "코인던전 공개" },
  { month: 8, day: 6, label: "바운티 제출" },
];

function loadEntries(): Entry[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "content/calendar.txt"), "utf-8");
  const entries: Entry[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split("|").map((s) => s.trim());
    if (parts.length < 3) continue;
    const [m, d] = parts[0].split("/").map((n) => parseInt(n, 10));
    if (!m || !d) continue;
    const author = parts[1].toUpperCase() === "S" ? "S" : "C";
    let text = parts.slice(2).join(" | ");
    const done = /^\[x\]/i.test(text);
    if (done) text = text.slice(3).trim();
    entries.push({ month: m, day: d, author, done, text });
  }
  return entries;
}

function kstToday(): { month: number; day: number } {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return { month: now.getUTCMonth() + 1, day: now.getUTCDate() };
}

const key = (m: number, d: number) => m * 100 + d;

export default function CalendarPage() {
  const entries = loadEntries();
  const today = kstToday();
  const todayKey = key(today.month, today.day);

  const byDate = new Map<number, Entry[]>();
  for (const e of entries) {
    const k = key(e.month, e.day);
    byDate.set(k, [...(byDate.get(k) ?? []), e]);
  }
  const dateKeys = [...byDate.keys()].sort((a, b) => a - b);
  const doneCount = entries.filter((e) => e.done).length;
  const pct = Math.round((doneCount / Math.max(1, entries.length)) * 100);

  const weekdayOf = (m: number, d: number) => WEEKDAYS[new Date(YEAR, m - 1, d).getDay()];
  const isRest = (es: Entry[]) => es.length > 0 && es.every((e) => /휴식/.test(e.text));

  const ddays = MILESTONES.map((ms) => {
    const diff = Math.round(
      (Date.UTC(YEAR, ms.month - 1, ms.day) - Date.UTC(YEAR, today.month - 1, today.day)) / 86400000
    );
    return { ...ms, diff };
  }).filter((ms) => ms.diff >= 0);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.4rem" }}>캘린더</h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1.1rem", lineHeight: 1.7 }}>
        한 달 스프린트의 공개 할 일 목록.{" "}
        <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.05rem 0.4rem", borderRadius: 3, fontWeight: 600 }}>shud</span>
        <span style={{ margin: "0 0.3rem", color: "#d1d5db" }}>+</span>
        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.05rem 0.4rem", borderRadius: 3, fontWeight: 600 }}>claude</span>
        가 같이 적습니다.
      </p>

      {/* D-day 칩 */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <span style={{ border: "1.5px solid #f59e0b", background: "#fffbeb", color: "#92400e", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem", fontWeight: 700 }}>
          오늘 {today.month}/{today.day} ({weekdayOf(today.month, today.day)})
        </span>
        {ddays.map((ms) => (
          <span key={ms.label} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem", color: "#374151" }}>
            {ms.label} <b style={{ color: "#dc2626" }}>{ms.diff === 0 ? "D-DAY" : `D-${ms.diff}`}</b>
          </span>
        ))}
      </div>

      {/* 진행률 바 */}
      <div style={{ marginBottom: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b7280", marginBottom: 4 }}>
          <span>진행률</span>
          <span>
            <b style={{ color: "#111" }}>{doneCount}</b>/{entries.length} ({pct}%)
          </span>
        </div>
        <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
        </div>
      </div>

      {/* 스프린트 스트립 */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "1.6rem", alignItems: "center" }}>
        {dateKeys.map((k) => {
          const m = Math.floor(k / 100), d = k % 100;
          const es = byDate.get(k) ?? [];
          const allDone = es.every((e) => e.done);
          const isToday = k === todayKey;
          const rest = isRest(es);
          const bg = allDone ? "#d1d5db" : rest ? "#bbf7d0" : k < todayKey ? "#fca5a5" : "#eef2ff";
          return (
            <a
              key={k}
              href={`#d${k}`}
              title={`${m}/${d} (${weekdayOf(m, d)})`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: bg,
                border: isToday ? "2.5px solid #f59e0b" : "1px solid #e5e7eb",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.55rem",
                color: "#374151",
                textDecoration: "none",
                fontWeight: isToday ? 800 : 400,
              }}
            >
              {d}
            </a>
          );
        })}
        <span style={{ fontSize: "0.72rem", color: "#9ca3af", marginLeft: 6 }}>
          ⬜예정 🟩휴식 ⬛완료 🟥밀림 · 클릭하면 그날로 이동
        </span>
      </div>

      {/* 타임라인 */}
      <div>
        {dateKeys.map((k) => {
          const m = Math.floor(k / 100), d = k % 100;
          const es = byDate.get(k) ?? [];
          const isToday = k === todayKey;
          const past = k < todayKey;
          const rest = isRest(es);
          return (
            <div
              key={k}
              id={`d${k}`}
              style={{
                display: "flex",
                gap: "0.9rem",
                padding: "0.6rem 0.6rem",
                borderRadius: 8,
                marginBottom: 2,
                background: isToday ? "#fffbeb" : "transparent",
                border: isToday ? "1.5px solid #f59e0b" : "1.5px solid transparent",
                opacity: past && !isToday ? 0.55 : 1,
              }}
            >
              <div style={{ minWidth: 74, fontSize: "0.86rem", fontWeight: 700, color: rest ? "#16a34a" : "#374151", paddingTop: 2 }}>
                {m}/{d} ({weekdayOf(m, d)})
                {isToday && (
                  <span style={{ display: "block", fontSize: "0.68rem", color: "#d97706", fontWeight: 800 }}>오늘</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {es.map((e, j) => (
                  <div key={j} style={{ fontSize: "0.92rem", lineHeight: 1.85, color: e.done ? "#9ca3af" : "#111", display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>{e.done ? "✅" : "⬜"}</span>
                    <span style={{ background: e.author === "S" ? "#fef3c7" : "#dbeafe", color: e.author === "S" ? "#92400e" : "#1e40af", fontSize: "0.68rem", padding: "0.02rem 0.35rem", borderRadius: 3, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {e.author === "S" ? "shud" : "claude"}
                    </span>
                    <span style={{ textDecoration: e.done ? "line-through" : "none" }}>{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "1.6rem", lineHeight: 1.7 }}>
        이 페이지는 저장소의 텍스트 파일 한 장으로 만들어집니다. 한 줄 = 할 일 하나. 사람이 적든 AI가 적든 같은 파일에 쌓입니다.
      </p>
    </div>
  );
}
