// 만든 도구 목록 — 홈 "만든 도구"와 /tools 가 이 배열 하나를 같이 쓴다.
// ⚠️ /tools/vbtc(비트코인 규칙 확인)·/tools/ma20(이격도)은 일부러 뺐다.
//    매수 규칙·신호처럼 읽힐 수 있어서 첫 화면에 내걸지 않는다(유사투자자문 표현 금지 원칙).
//    페이지는 그대로 살아 있다.
export interface Tool {
  href: string;
  name: string;
  desc: string;
  mark: string;
  color: string;
}

export const TOOLS: Tool[] = [
  { href: "/events", name: "코인 일정판", desc: "앞으로 4주 토큰 언락·투표·업그레이드·미국 지표", mark: "▦", color: "#191f28" },
  { href: "/alpha", name: "데일리 알파", desc: "크립토 트위터를 매일 아침 AI로 모아 요약", mark: "α", color: "#ff7a2e" },
  { href: "/tools/gap", name: "온체인 vs 거래소 가격차", desc: "같은 코인이 두 곳에서 얼마나 다르게 팔리나", mark: "≠", color: "#3182f6" },
  { href: "/tools/onchain-flow", name: "온체인 자금 흐름", desc: "체인별 돈이 어디로 들어오고 나가는지", mark: "→", color: "#03a65f" },
  { href: "/tools/funding", name: "펀딩 성분 보기", desc: "선물 펀딩비를 성분별로 쪼개서 보기", mark: "%", color: "#8b5cf6" },
  { href: "/tools/eye-record", name: "채점 기록", desc: "찍은 판단이 맞았는지 나중에 채점", mark: "✓", color: "#4c5ee8" },
  { href: "/tools/onchain", name: "온체인 손익 조회기", desc: "지갑 주소로 실제 손익 확인", mark: "Σ", color: "#0e9aa7" },
  { href: "/ftd", name: "FTD 신호기 해설", desc: "팔로우 스루 데이를 쉽게 풀어 쓴 설명서", mark: "F", color: "#e8890c" },
];
