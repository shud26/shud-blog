import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개 — shud.log",
  description: "shud.log를 소개합니다",
};

export default function AboutPage() {
  return (
    <main style={{ padding: "2rem 0 4rem" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>소개</h1>
      <div style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "#374151" }}>
        <p style={{ marginBottom: "1rem" }}>
          <strong>shud.log</strong>는 코딩을 독학하며 만든 것들과 운영하면서 배운 것들을 기록하는
          개발 블로그입니다.
        </p>
        <p style={{ marginBottom: "1rem" }}>
          트레이딩 봇을 설계하고 굴리면서 겪은 실패와 결산, 웹 게임을 만들며 부딪힌 문제들,
          맥미니 홈서버와 자동화 파이프라인 운영기, 온체인 파밍 실험까지 — 직접 해보고 깨진
          경험만 씁니다. 어디서나 볼 수 있는 정보 정리가 아니라, 해본 사람만 쓸 수 있는 기록을
          남기는 것이 목표입니다.
        </p>
        <p style={{ marginBottom: "1rem" }}>
          글에 나오는 코드와 수치는 실제 운영 환경에서 나온 것들입니다. 다만 투자 관련 내용은
          전부 개인 기록일 뿐, 투자 권유나 조언이 아닙니다.
        </p>
        <p>
          만든 것들: <a href="https://coindungeon.games" style={{ color: "#2563eb" }}>코인던전</a>{" "}
          (크립토 교육 게임) 외 블로그 글에서 소개하는 봇과 도구들. GitHub{" "}
          <a href="https://github.com/shud26" style={{ color: "#2563eb" }}>@shud26</a>에서 활동합니다.
        </p>
      </div>
    </main>
  );
}
