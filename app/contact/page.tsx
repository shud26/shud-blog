import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "연락처 — shud.log",
  description: "shud.log 연락처",
};

export default function ContactPage() {
  return (
    <main style={{ padding: "2rem 0 4rem" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>연락처</h1>
      <div style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "#374151" }}>
        <p style={{ marginBottom: "1rem" }}>
          블로그 내용에 대한 질문, 오류 제보, 기타 문의는 아래 채널로 연락 주세요.
        </p>
        <ul style={{ paddingLeft: "1.25rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            GitHub: <a href="https://github.com/shud26" style={{ color: "#2563eb" }}>github.com/shud26</a>{" "}
            (이슈 또는 프로필의 연락처로)
          </li>
        </ul>
      </div>
    </main>
  );
}
