import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — shud.log",
  description: "shud.log 개인정보처리방침",
};

const S = { h: { fontSize: "1.05rem", fontWeight: 700 as const, margin: "1.75rem 0 0.5rem" }, p: { marginBottom: "0.75rem" } };

export default function PrivacyPage() {
  return (
    <main style={{ padding: "2rem 0 4rem" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>개인정보처리방침</h1>
      <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "1.5rem" }}>시행일: 2026년 7월 16일</p>
      <div style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "#374151" }}>
        <p style={S.p}>
          shud.log(shud26.com, 이하 &quot;본 사이트&quot;)는 방문자의 개인정보를 소중히 여기며,
          관련 법령을 준수합니다. 본 방침은 본 사이트가 어떤 정보를 수집하고 어떻게 사용하는지 설명합니다.
        </p>

        <h2 style={S.h}>1. 수집하는 정보</h2>
        <p style={S.p}>
          본 사이트는 회원가입 기능이 없으며, 방문자의 이름·이메일 등 개인 식별 정보를 직접
          수집하지 않습니다. 다만 서비스 운영 과정에서 다음 정보가 자동으로 수집될 수 있습니다:
          접속 IP 주소, 브라우저 종류, 방문 일시, 방문 페이지 등 서버 로그와 쿠키.
        </p>

        <h2 style={S.h}>2. 쿠키의 사용</h2>
        <p style={S.p}>
          본 사이트는 서비스 개선과 광고 제공을 위해 쿠키를 사용할 수 있습니다. 방문자는 브라우저
          설정에서 쿠키 저장을 거부하거나 삭제할 수 있으며, 이 경우 일부 기능 이용에 제한이 있을 수 있습니다.
        </p>

        <h2 style={S.h}>3. 광고 (Google AdSense)</h2>
        <p style={S.p}>
          본 사이트는 Google AdSense 광고를 게재할 수 있습니다. Google을 포함한 제3자 광고
          사업자는 쿠키를 사용하여 방문자의 이전 방문 기록을 바탕으로 맞춤형 광고를 제공할 수
          있습니다. 방문자는{" "}
          <a href="https://www.google.com/settings/ads" style={{ color: "#2563eb" }}>Google 광고 설정</a>에서
          맞춤형 광고를 비활성화할 수 있습니다. Google의 광고 쿠키 사용에 대한 자세한 내용은{" "}
          <a href="https://policies.google.com/technologies/ads" style={{ color: "#2563eb" }}>Google 광고 정책</a>을
          참고하세요.
        </p>

        <h2 style={S.h}>4. 통계 도구</h2>
        <p style={S.p}>
          본 사이트는 방문자 통계 분석 도구(예: Vercel Analytics)를 사용할 수 있으며, 이 과정에서
          수집되는 정보는 통계 목적으로만 사용됩니다.
        </p>

        <h2 style={S.h}>5. 개인정보의 제3자 제공</h2>
        <p style={S.p}>
          본 사이트는 방문자의 개인정보를 외부에 판매하거나 제공하지 않습니다. 단, 법령에 따라
          요구되는 경우는 예외로 합니다.
        </p>

        <h2 style={S.h}>6. 문의</h2>
        <p style={S.p}>
          본 방침에 대한 문의는 <a href="/contact" style={{ color: "#2563eb" }}>연락처 페이지</a>를
          통해 할 수 있습니다. 본 방침은 법령이나 서비스 변경에 따라 수정될 수 있으며, 변경 시
          본 페이지에 게시합니다.
        </p>
      </div>
    </main>
  );
}
