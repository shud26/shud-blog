import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "팔로우 스루 데이(FTD) 완전 정복 — shud.log",
  description:
    "떨어지던 주식시장이 진짜로 다시 오르기 시작하는지 확인하는 신호, 팔로우 스루 데이. 같은 개념을 중학생부터 투자자까지 4단계 깊이로 정리했습니다.",
};

/* ── 차트 1: 반등 카운트 → FTD 캔들차트 (마우스 올리면 설명) ── */
function chart1(): string {
  const W = 680, H = 320, L = 24, R = 18, PT = 48, PB = 198, VT = 244, VB = 298;
  type Candle = { o: number; h: number; l: number; c: number; v: number; t: string; d?: number; ftd?: number };
  const C: Candle[] = [
    { o: 99, h: 100, l: 96, c: 97, v: 0.45, t: "하락 시작 — 검은 봉(내린 날)이 이어져요" },
    { o: 97, h: 98, l: 92.5, c: 93.5, v: 0.5, t: "계속 하락" },
    { o: 93.5, h: 94.5, l: 89, c: 90, v: 0.5, t: "계속 하락" },
    { o: 90, h: 91, l: 85.5, c: 86.5, v: 0.55, t: "계속 하락" },
    { o: 86.5, h: 87.5, l: 82, c: 83, v: 0.5, t: "계속 하락" },
    { o: 83, h: 84, l: 78.5, c: 79.5, v: 0.62, t: "투매 — 더 빠르게 하락" },
    { o: 79.5, h: 80.5, l: 74.5, c: 76, v: 0.55, t: "바닥 근처에서 출렁" },
    { o: 76, h: 77.5, l: 72, c: 74, d: 0, v: 0.6, t: "0일차 = 바닥! 가장 낮은 날. 이 저점이 마지노선(깨지면 리셋)" },
    { o: 74, h: 78, l: 73.5, c: 77.5, d: 1, v: 0.5, t: "1일차 = 첫 반등(흰 봉). 여기서부터 날짜를 셉니다" },
    { o: 77.5, h: 79, l: 75.5, c: 76.5, d: 2, v: 0.4, t: "2일차 = 쉬어감. 힘을 모으는 중" },
    { o: 76.5, h: 79.5, l: 75, c: 78.5, d: 3, v: 0.42, t: "3일차 = 쉬어감. 아직 4일차 전이라 신뢰 낮음" },
    { o: 78.5, h: 86.5, l: 78, c: 85.5, d: 4, ftd: 1, v: 0.95, t: "4일차 = FTD! 큰 흰 봉(+1% 이상) + 거래량 급증 → 상승 추세 확인!" },
    { o: 85.5, h: 89, l: 84.5, c: 88, v: 0.6, t: "추세 이어짐 (FTD 성공)" },
    { o: 88, h: 92, l: 87, c: 91, v: 0.62, t: "상승 지속" },
    { o: 91, h: 95, l: 90, c: 94, v: 0.6, t: "상승 지속 — FTD 적중!" },
  ];
  const min = 70, max = 102, slot = (W - L - R) / C.length;
  const cx = (i: number) => L + slot * i + slot / 2;
  const cw = Math.min(18, slot * 0.62);
  const y = (p: number) => PT + ((max - p) / (max - min)) * (PB - PT);
  const i0 = C.findIndex((d) => d.d === 0), i1 = C.findIndex((d) => d.d === 1), i4 = C.findIndex((d) => d.ftd);
  let cs = "";
  C.forEach((d, i) => {
    const X = cx(i), up = d.c >= d.o;
    const bt = y(Math.max(d.o, d.c)), bh = Math.max(2.5, y(Math.min(d.o, d.c)) - bt);
    const fill = up ? "#fff" : "#3a3a3a", vh = d.v * (VB - VT);
    cs += `<g style="cursor:pointer"><title>${d.t}</title>`
      + `<line x1="${X}" y1="${y(d.h).toFixed(1)}" x2="${X}" y2="${y(d.l).toFixed(1)}" stroke="#111" stroke-width="${d.ftd ? 1.8 : 1.2}"/>`
      + `<rect x="${(X - cw / 2).toFixed(1)}" y="${bt.toFixed(1)}" width="${cw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}" stroke="#111" stroke-width="${d.ftd ? 2.8 : 1.3}"/>`
      + `<rect x="${(X - cw / 2).toFixed(1)}" y="${(VB - vh).toFixed(1)}" width="${cw.toFixed(1)}" height="${vh.toFixed(1)}" fill="${d.ftd ? "#111" : "#cfcfcf"}"/>`
      + (d.d !== undefined ? `<text x="${X}" y="226" fill="${d.ftd ? "#111" : "#666"}" font-size="11" font-weight="${d.ftd ? "800" : "600"}" text-anchor="middle">${d.d}일</text>` : "")
      + `</g>`;
  });
  const ly = y(C[i0].l);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="${L}" y="${PT - 30}" fill="#888" font-size="11">가격 (캔들: 흰 봉=오른 날 · 검은 봉=내린 날 · 봉에 마우스를 올리면 설명)</text>
    <line x1="${L}" y1="${ly.toFixed(1)}" x2="${W - R}" y2="${ly.toFixed(1)}" stroke="#111" stroke-width="1.2" stroke-dasharray="5 4" opacity=".5"/>
    <text x="${W - R}" y="${(ly - 6).toFixed(1)}" fill="#555" font-size="11" text-anchor="end">마지노선 (0일차 저점 — 깨지면 무효)</text>
    ${cs}
    <text x="${cx(i1)}" y="${(y(C[i1].h) - 9).toFixed(1)}" fill="#555" font-size="11" text-anchor="middle">첫 반등</text>
    <text x="${cx(i4)}" y="${(y(C[i4].h) - 10).toFixed(1)}" fill="#111" font-size="13" font-weight="800" text-anchor="middle">★ FTD!</text>
    <text x="${L}" y="${VT - 6}" fill="#888" font-size="11">거래량</text>
    <text x="${cx(i4)}" y="${VB + 16}" fill="#111" font-size="10" font-weight="700" text-anchor="middle">↑ 급증</text>
    <text x="${W - R}" y="${H - 4}" fill="#9aa1ad" font-size="10" text-anchor="end">시간 →</text></svg>`;
}

/* ── 차트 2: 200일선 체제 맵 ── */
function chart2(): string {
  const W = 640, H = 260, L = 20, R = 20, T = 20, B = 24, N = 60;
  const pr: number[] = [];
  for (let i = 0; i < N; i++) {
    let v: number;
    if (i < 18) v = 60 + i * 2.1;
    else if (i < 38) v = 97 - (i - 18) * 1.9;
    else v = 59 + (i - 38) * 2.0;
    pr.push(v + Math.sin(i / 2) * 1.4);
  }
  const ma = pr.map((_, i) => { const a = pr.slice(Math.max(0, i - 9), i + 1); return a.reduce((x, y2) => x + y2, 0) / a.length; });
  const min = Math.min(...pr) - 4, max = Math.max(...pr) + 4;
  const x = (i: number) => L + i * ((W - L - R) / (N - 1));
  const y = (p: number) => T + ((max - p) / (max - min)) * (H - T - B);
  let shade = "";
  for (let i = 0; i < N - 1; i++) {
    const below = pr[i] < ma[i];
    shade += `<rect x="${x(i)}" y="${T}" width="${x(i + 1) - x(i) + 0.6}" height="${H - T - B}" fill="${below ? "#cfcfcf" : "#eee"}"/>`;
  }
  const prLine = pr.map((p, i) => `${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const maLine = ma.map((p, i) => `${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${shade}
    <polyline points="${maLine}" fill="none" stroke="#999" stroke-width="1.5" stroke-dasharray="4 4"/>
    <polyline points="${prLine}" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>
    <text x="${x(8)}" y="${T + 16}" fill="#333" font-size="11" font-weight="700">상승 체제</text>
    <text x="${x(25)}" y="${T + 16}" fill="#333" font-size="11" font-weight="700">약세장 (선 아래)</text>
    <text x="${x(48)}" y="${T + 16}" fill="#333" font-size="11" font-weight="700">회복</text></svg>`;
}

/* ── 임계치 타임라인 + 성공/실패 도넛 ── */
function timeline(): string {
  const data: [string, string, number][] = [["1988", "1.0%", 1.0], ["2000s", "1.7%", 1.7], ["지수맞춤", "2.2%", 2.2], ["현재", "1.25%", 1.25]];
  const maxv = 2.2, W = 480, H = 170, bw = 62, gap = (W - bw * 4) / 5;
  let s = "";
  data.forEach((d, i) => {
    const bx = gap + i * (bw + gap), bh = (d[2] / maxv) * 110, by = 130 - bh;
    s += `<rect x="${bx}" y="${by.toFixed(0)}" width="${bw}" height="${bh.toFixed(0)}" rx="6" fill="#1a1a1a"/>`
      + `<text x="${bx + bw / 2}" y="${(by - 8).toFixed(0)}" fill="#111" font-size="14" font-weight="800" text-anchor="middle">${d[1]}</text>`
      + `<text x="${bx + bw / 2}" y="152" fill="#5c6573" font-size="11" text-anchor="middle">${d[0]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
function donut(): string {
  const r = 52, c = 2 * Math.PI * r, half = c / 2;
  return `<svg viewBox="0 0 140 140" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="#dcdcdc" stroke-width="20"/>
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="#111" stroke-width="20" stroke-dasharray="${half} ${c}" transform="rotate(-90 70 70)"/>
    <text x="70" y="66" fill="#111" font-size="20" font-weight="800" text-anchor="middle">50%</text>
    <text x="70" y="86" fill="#777" font-size="11" text-anchor="middle">성공률</text></svg>`;
}

export default function FtdPage() {
  return (
    <main style={{ padding: "1.5rem 0 4rem" }}>
      {/* eslint-disable @next/next/no-img-element */}
      <img src="/images/ftd/ftd-hero.png" alt="폭락 후 바닥에서 일출과 함께 반등하는 차트 모양의 산" className="ftd-img" style={{ marginTop: 0 }} />

      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "1.25rem 0 0.4rem", lineHeight: 1.25 }}>
        팔로우 스루 데이 (FTD)
      </h1>
      <p style={{ color: "#5c6573", fontSize: "0.98rem", lineHeight: 1.75, margin: 0 }}>
        &ldquo;떨어지던 주식시장이 진짜로 다시 오르기 시작하는지&rdquo;를 확인하는 신호.
        같은 개념을 네 가지 깊이로 정리했습니다. 편한 단계부터 한 칸씩 올라가 보세요.
      </p>
      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "8px 0 0" }}>
        출처: Webby Rambles On — Mike Webster (전 IBD, 윌리엄 오닐의 오른팔) · FTD 1·2부
      </p>

      <nav className="ftd-nav">
        <a href="#lv1"><img src="/icons/ftd-lv1.png" alt="" />중학생</a>
        <a href="#lv2"><img src="/icons/ftd-lv2.png" alt="" />고등학생</a>
        <a href="#lv3"><img src="/icons/ftd-lv3.png" alt="" />대학생</a>
        <a href="#lv4"><img src="/icons/ftd-lv4.png" alt="" />투자자</a>
        <a href="https://ftd.shud26.com/now.html">지금 코스피는?</a>
      </nav>

      {/* ───────── 1. 중학생 ───────── */}
      <h2 className="ftd-h2" id="lv1"><img src="/icons/ftd-lv1.png" alt="" />중학생 버전</h2>
      <p className="ftd-sub">비유로 큰 그림만 — 한 번에 이해되게</p>

      <div className="ftd-card">
        <h3>한 문장으로</h3>
        <p><span className="ftd-hl">한참 떨어지던 주식시장이 &ldquo;이제 진짜 다시 오른다!&rdquo;고 알려주는 날</span>이에요.</p>
        <img src="/images/ftd/ftd-sick.png" alt="아파서 누워있던 아이가 벌떡 일어나 밥을 먹는 전후 비교 그림" className="ftd-img" />
        <p className="ftd-cap">감기 비유 — 다 나은 걸 어떻게 알까?</p>
        <p>
          며칠 앓아눕던 친구가 어느 날 <b>벌떡 일어나 밥 한 그릇을 뚝딱</b> 먹으면 &ldquo;아, 다 나았네!&rdquo; 알 수 있죠?
          시장도 한참 아프다가 <b>어느 날 &ldquo;확!&rdquo; 크게 오르면</b> &ldquo;이제 건강해졌다&rdquo;는 신호예요. 그 날이 바로 <b>팔로우 스루 데이</b>.
        </p>
      </div>

      <div className="ftd-card">
        <h3>어떻게 알아봐요?</h3>
        <p>차트로 보면 이런 모양이에요. 떨어지다가, 바닥에서 며칠 버티고, <span className="ftd-hl">4일째쯤 크게 점프하는 날</span>이 신호예요.</p>
        <div className="ftd-chart">
          <div className="t">떨어지다가 → 바닥 → 크게 점프(FTD)</div>
          <div className="s">캔들에 마우스를 올리면 그 날의 설명이 떠요</div>
          <div dangerouslySetInnerHTML={{ __html: chart1() }} />
        </div>
        <h4>차트 읽는 법 (5단계)</h4>
        <ol>
          <li><b>하락</b> — 검은 봉(내린 날)이 줄줄이 이어지며 쭉 떨어져요</li>
          <li><b>0일차 = 바닥</b> — 가장 낮은 날. 이 저점이 <b>마지노선</b>(점선). 나중에 다시 깨지면 신호 무효!</li>
          <li><b>1일차 = 첫 반등</b> — 바닥 다음 처음 오른 날(흰 봉). <b>여기서부터 날짜를 셉니다</b></li>
          <li><b>2~3일차 = 쉬어감</b> — 작게 움직이며 힘을 모아요. 너무 빨리 치솟으면 가짜!</li>
          <li><b>4일차 이후 = FTD</b> — <b>큰 흰 봉(+1% 이상) + 거래량 급증</b> → &ldquo;상승 추세 시작 확인!&rdquo;</li>
        </ol>
      </div>

      <div className="ftd-card">
        <h3>꼭 기억할 3가지</h3>
        <div className="ftd-grid3">
          <div className="ftd-mini"><b>비 온 뒤 맑음</b><span>계속 흐리다가 해가 쨍 나는 순간이에요.</span></div>
          <div className="ftd-mini"><b>타율은 5할</b><span>2번 중 1번만 맞아요. 100% 믿으면 안 돼요.</span></div>
          <div className="ftd-mini"><b>너무 빠르면 가짜</b><span>2~3일 만에 확 가면 오히려 가짜일 확률이 높아요.</span></div>
        </div>
        <img src="/images/ftd/fx-getup.png" alt="넘어졌다가 다시 단단하게 일어선 사람" className="ftd-img" />
        <p className="ftd-cap">일어나는 척은 누구나 한다 — 진짜 회복은 며칠 뒤에도 서 있는 것</p>
        <div className="ftd-warn">
          <b>가짜도 있어요.</b> 일어났다가 다시 눕는 친구처럼, 신호가 떠도 도로 떨어질 때가 절반이에요. 그래서 한 발은 빼놓고 조심해요.
        </div>
      </div>

      {/* ───────── 2. 고등학생 ───────── */}
      <h2 className="ftd-h2" id="lv2"><img src="/icons/ftd-lv2.png" alt="" />고등학생 버전</h2>
      <p className="ftd-sub">날짜 세는 규칙과 기본 조건까지</p>

      <div className="ftd-card">
        <h3>핵심 개념: 반등 시도 (Rally Attempt)</h3>
        <p>시장이 바닥에서 <b>&ldquo;다시 올라가 볼까?&rdquo; 하고 시도</b>하는 걸 반등 시도라고 해요. 오닐의 철학은 <span className="ftd-hl">&ldquo;예측하지 말고 해석하라&rdquo;</span>.</p>
        <h4>날짜 세는 법 (이게 핵심!)</h4>
        <ol>
          <li><b>0일차(바닥)</b> — 가장 낮게 떨어진 날. 이 날의 <b>최저점이 마지노선</b>이에요.</li>
          <li><b>1일차</b> — 바닥 다음에 <b>종가가 오른 첫 날</b>. 아무리 조금(+0.1%)이라도 오르면 1일차. 살짝 내려 마감했어도 <b>봉의 위쪽 절반에서 마감</b>했다면 인정(&ldquo;핑크 랠리 데이&rdquo; — OR 조건).</li>
          <li><b>2·3일차</b> — 그냥 쉬어가는 날. 조용히 버티기.</li>
          <li><b>4일차 이후 = FTD 가능</b> — 주요 지수가 하루에 <span className="ftd-hl">+1% 이상 크게</span> 오르고 거래량도 늘면 상승 추세 시작 확인.</li>
        </ol>
        <div className="ftd-warn"><b>리셋 규칙:</b> 0일차 최저점을 <b>장중에라도</b> 다시 깨면(undercut) 카운트 무효, 처음부터 다시 셉니다. 종가가 아니라 <b>장중 저가 기준</b> — 단, FTD 성립 <i>이후</i>의 실패 판정은 반대로 종가 기준이에요(아래 탈출 신호).</div>
      </div>

      <div className="ftd-card">
        <h3>왜 &ldquo;4일째 이후&rdquo;여야 해요?</h3>
        <img src="/images/ftd/ftd-engine.png" alt="추운 겨울 아침 시동을 거는 자동차" className="ftd-img" />
        <p className="ftd-cap">시동 비유 — 몇 번 버벅대다가 제대로 걸린다</p>
        <p>
          추운 날 차 시동을 걸면 <b>몇 번 버벅대다가(2·3일 쉬어감)</b> 어느 순간 제대로 걸려요(4일째 FTD).
          너무 빨리 가면 <b>금방 꺼지는 가짜</b>예요. 오닐은 &ldquo;식히는 시간(cooling off)&rdquo;이 필요하다고 했어요.
        </p>
      </div>

      <div className="ftd-card">
        <h3>FTD는 초록불 — 그래도 좌우는 보고 건너기</h3>
        <img src="/images/ftd/ftd-light.png" alt="초록불이지만 좌우를 살피며 건너는 아이" className="ftd-img" />
        <p>
          FTD는 <span className="ftd-hl">초록불</span>이에요. 근데 초록불이라고 눈 감고 건너면 안 되죠?
          <b> 좌우 보고(다른 신호 확인) 건너야</b> 해요.
        </p>
        <h4>거래량은 &ldquo;전날보다&rdquo; 많으면 OK</h4>
        <p>
          흔한 오해: &ldquo;거래량이 평균보다 높아야 한다&rdquo; → 아닙니다.<br />
          진짜 규칙: <b>그냥 전날보다 많으면 충분</b>해요. 오닐도 평균 이상이면 좋아했지만 필수는 아니었어요.
        </p>
      </div>

      {/* ───────── 3. 대학생 ───────── */}
      <h2 className="ftd-h2" id="lv3"><img src="/icons/ftd-lv3.png" alt="" />대학생 버전</h2>
      <p className="ftd-sub">정확한 규칙 · 역사 · 실패 관리</p>

      <div className="ftd-card">
        <h3>정의와 뿌리</h3>
        <p>
          윌리엄 오닐이 <i>How to Make Money in Stocks</i>에서 정립한 <span className="ftd-hl">시장 타이밍 도구</span>.
          천장 신호인 <b>분산일(distribution day)</b>의 거울상이에요.
          <b> 원래는 &ldquo;주요 약세장 바닥(고점 대비 −20%)&rdquo;에서만 쓰는 도구</b>였는데, 신문 칼럼 때문에 일상적으로
          남용되며 변질됐어요. 오닐 본인도 &ldquo;큰 실수&rdquo;라고 인정했습니다.
        </p>
        <div className="ftd-quote">
          &ldquo;규칙은 변한다. 시장 변동성이 변하니까. Bill은 순간에 살았다 — 그때그때의 규칙이 곧 규칙이었다.&rdquo;
          <span>— Webby (책 1~4판마다 규칙이 다름)</span>
        </div>
      </div>

      <div className="ftd-card">
        <h3>상승 % 임계치의 역사</h3>
        <img src="/images/ftd/fx-wave.png" alt="잔잔한 바다의 작은 파도와 태풍 치는 바다의 큰 파도" className="ftd-img" />
        <p className="ftd-cap">잔잔한 바다의 1m 파도는 사건이지만, 태풍 바다에선 그냥 물결 — 그래서 기준은 변동성을 따라간다</p>
        <p>임계치는 고정값이 아니라 <span className="ftd-hl">시대에 따라 계속 진화</span>했어요.</p>
        <div className="ftd-chart">
          <div className="t">FTD 상승률 임계치의 변천</div>
          <div className="s">높을수록 진입이 늦어짐 — &ldquo;1.7% 기다리다 FOMO로 늦게 물리는&rdquo; 함정</div>
          <div dangerouslySetInnerHTML={{ __html: timeline() }} />
        </div>
        <table className="ftd-table">
          <tbody>
            <tr><th>시기</th><th>임계치</th><th>배경</th></tr>
            <tr><td>1988 (초판)</td><td><b>+1.0%</b></td><td>오닐이 FTD 정식화</td></tr>
            <tr><td>2000년대 초</td><td><b>+1.6~1.7%</b></td><td>90년대 말 변동성 폭증 — 1%가 너무 쉬워짐</td></tr>
            <tr><td>이후</td><td><b>지수별 맞춤</b></td><td>S&P 2.2% / 나스닥 1.7% — &ldquo;너무 주관적&rdquo;이라 폐기</td></tr>
            <tr><td>Market School (현재)</td><td><b>+1.0% / 1.25%</b></td><td>원점 회귀. 고변동성장만 1.25%</td></tr>
          </tbody>
        </table>
        <p style={{ color: "#9ca3af", fontSize: "0.83rem" }}>
          고변동성 판정: 최근 200일 중 <b>&ldquo;상승일만&rdquo;</b>의 평균이 1% 초과면 1.25% 적용 (하락장 큰 음봉 왜곡 제거)
        </p>
      </div>

      <div className="ftd-card">
        <h3>실패 관리 — &ldquo;절반은 실패한다&rdquo;</h3>
        <div className="ftd-chart">
          <div className="t">FTD 성공 vs 실패</div>
          <div className="s">진짜 바닥 FTD도 약 50%만 성공 — 그래서 손절 규칙이 필수</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <div dangerouslySetInnerHTML={{ __html: donut() }} />
            <div style={{ fontSize: "0.88rem", color: "#5c6573", maxWidth: 290 }}>
              <p style={{ margin: "4px 0" }}><b style={{ color: "#111" }}>성공 약 50%</b> — 새 상승장 시작</p>
              <p style={{ margin: "4px 0" }}><b style={{ color: "#111" }}>실패 약 50%</b> — 며칠 뒤 무너짐</p>
              <p style={{ margin: "10px 0 0", fontSize: "0.82rem" }}>성공하는 FTD는 <b>25일 안에 &ldquo;추가 FTD&rdquo;</b>가 한 번 더 나와요.</p>
              <p style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>윌리엄오닐컴퍼니 공식 연구(1970~, S&amp;P 9%+ 조정 35회): <b>첫 FTD 성공 19회(54%)</b> · 첫 FTD 실패 8회는 <b>두 번째 FTD가 성공</b> — 리셋 후 빠른 재점등은 정상 패턴.</p>
            </div>
          </div>
        </div>
        <h4>탈출 신호 (Market School 발명)</h4>
        <ol>
          <li><span className="ftd-hl">FTD 봉의 저점을 종가로 깨면</span> 실패 시작, 즉시 탈출. 장중 이탈은 OK, 종가가 중요.</li>
          <li><b>21일선(EMA)을 종가로 결정적 이탈</b> — 캐릭터 변화, 후퇴 신호.</li>
          <li>0일차 반등 저점 이탈 — 반등 자체 종료.</li>
        </ol>
      </div>

      <div className="ftd-card">
        <h3>왜 거래량을 점점 안 믿게 됐나</h3>
        <p>Webby는 <span className="ftd-hl">&ldquo;이제 거래량을 안 쓴다&rdquo;</span>고 해요. 거래량이 <b>&ldquo;더러운 데이터(dirty data)&rdquo;</b>가 됐기 때문이에요.
          탈십진화·무료 수수료·소수점 주식으로 거래 건수가 폭증했고, ETF·다크풀·데일리 옵션 때문에 진짜 매수세를
          가늠할 수 없게 됐고, 트리플 위칭·리밸런싱·반일장이 인위적인 스파이크를 만들거든요.</p>
        <div className="ftd-quote">
          &ldquo;더러운 데이터는 위험한 데이터다. 실패한 건 그냥 실패한 거지, 거래량 탓이 아니다.&rdquo;
          <span>— Webby</span>
        </div>
        <p style={{ fontSize: "0.86rem" }}>
          다만 이건 Webby의 <b>현대 미국장 한정 의견</b>이고, 오닐 정본과 윌리엄오닐컴퍼니 현행 기준은 여전히
          <span className="ftd-hl"> &ldquo;거래량 전일↑&rdquo;를 필수</span>로 봐요. 그래서 이 사이트의
          <a href="https://ftd.shud26.com/now.html" style={{ color: "inherit" }}> 코스피 실황 판정</a>은 정본대로 거래량 조건을 요구하되,
          가격만 충족한 날은 &ldquo;in spirit FTD&rdquo;로 따로 표시합니다 (2026-07 원전 대조 리서치 반영).
        </p>
      </div>

      {/* ───────── 4. 투자자 ───────── */}
      <h2 className="ftd-h2" id="lv4"><img src="/icons/ftd-lv4.png" alt="" />투자자 버전</h2>
      <p className="ftd-sub">체제 인식 · 연도별 실전 사례 · 봇 자동화</p>

      <div className="ftd-card">
        <h3>200일선 = 강세/약세 &ldquo;체제(Regime)&rdquo;의 분기선</h3>
        <p>2부의 핵심. <span className="ftd-hl">월봉 9개월선 ≈ 200일선 ≈ 40주선</span> — 같은 것의 다른 이름. 이 선 기준으로 시장 성격이 완전히 달라져요.</p>
        <div className="ftd-chart">
          <div className="t">200일선 체제 맵</div>
          <div className="s">검은 선 = 주가 · 회색 점선 = 200일선 · 밝은 배경 = 상승 체제 · 어두운 배경 = 약세</div>
          <div dangerouslySetInnerHTML={{ __html: chart2() }} />
        </div>
        <ol>
          <li><b>주가가 200일선 위</b> = 상승 체제. FTD 신뢰도 올라감, 적극 진입 OK.</li>
          <li><b>주가가 200일선 아래</b> = 약세·횡보 체제. FTD가 자주 실패, 비중 절반만.</li>
          <li>역사상 큰 약세장(2000·2008)은 <b>전부 200일선 아래</b>에서 진행됐어요. 신호보다 <b>체제부터</b> 확인.</li>
        </ol>
        <div className="ftd-quote">
          &ldquo;200일선 위에선 좋은 일이, 아래에선 나쁜 일이 일어난다. 2000–02, 07–09, 73–74 — 큰 약세장은 모두 9개월선 아래에서 길게 머물렀다.&rdquo;
          <span>— Webby</span>
        </div>
      </div>

      <div className="ftd-card">
        <h3>연도별 실전 사례 — 200일선 아래 FTD 대장정</h3>
        <img src="/images/ftd/fx-museum.png" alt="차트 액자가 걸린 박물관 복도를 걷는 관람객" className="ftd-img" />
        <p>Webby가 1978년부터 짚은 실제 사례들. <span className="ftd-hl">200일선 아래 FTD는 절반 이상이 실패</span>하지만, 작동할 땐 큰 상승의 출발점이 됐어요.</p>
        <table className="ftd-table">
          <tbody>
            <tr><th>시점</th><th>상황</th><th>결과 / 교훈</th></tr>
            <tr><td><b>1978-12</b></td><td>대형 강세장 후 200일선 붕괴, FTD +1.31%</td><td>실패 — 12-18 FTD 저점 이탈. 진짜는 79-01</td></tr>
            <tr><td><b>1981-10</b></td><td>09-28 투매 바닥, FTD +1.81%</td><td>성공 — 12-08 21일선 첫 이탈로 마감</td></tr>
            <tr><td><b>1982-08</b></td><td>3파동 하락의 마지막, 저점 21일선 위 복귀</td><td>대성공 — 레이건 시대 대형 랠리. &ldquo;21일선이 다 잡았다&rdquo;</td></tr>
            <tr><td><b>1984-08</b></td><td>FTD +1.59%, 수많은 파동(6파동 논쟁)</td><td>&ldquo;FTD는 실패해도 괜찮다&rdquo;의 교과서 — 12-18 재시도 성공</td></tr>
            <tr><td><b>1990-10</b></td><td>이상적 FTD였으나 등락만 반복</td><td>까다로움 — 91-01 &ldquo;후속 FTD&rdquo;에서 대형 상승</td></tr>
            <tr><td><b>1998</b></td><td>33% 급락(매우 짧음), 오닐이 AOL·Schwab 매수</td><td>성공 — 짧고 깊은 조정은 투매가 정상</td></tr>
            <tr><td><b>2003-03</b></td><td>닷컴 약세장 바닥, 오닐이 eBay 매수</td><td>성공 — 03-17 명백한 FTD. 2009와 닮은 더블바텀</td></tr>
            <tr><td><b>2009-03</b></td><td>역대 3위 약세장 바닥 — 평범한 하락일</td><td>성공 — &ldquo;큰 약세장 바닥엔 패닉이 없다&rdquo;</td></tr>
            <tr><td><b>2020-04</b></td><td>COVID 폭락, &ldquo;Tom Petty FTD&rdquo;</td><td>성공 — 단 &ldquo;1998 더블바텀 될 줄&rdquo;은 오판</td></tr>
            <tr><td><b>2018-12→19-01</b></td><td>파월 쇼크, 01-04 &ldquo;in spirit FTD&rdquo;</td><td>나스닥 거래량 미달이나 S&P는 FTD. 진짜는 01-15</td></tr>
            <tr><td><b>2022</b></td><td>1·3·5월 투매 바닥마다 FTD</td><td>연쇄 실패 — 200일선 아래 = &ldquo;열정 자제&rdquo; 구간</td></tr>
            <tr><td><b>2022-10→23</b></td><td>1·2·3파동이 &ldquo;너무 교과서적&rdquo;이라 의심</td><td>성공 — &ldquo;조정 기다리지 마라. 시장은 원래 이렇게 간다&rdquo;</td></tr>
          </tbody>
        </table>
      </div>

      <div className="ftd-card">
        <h3>200일선 아래에서의 처방</h3>
        <div className="ftd-grid3">
          <div className="ftd-mini"><b>안 놀기</b><span>가장 안전. 인내심 있으면 현금 대기 (몇 년일 수도).</span></div>
          <div className="ftd-mini"><b>50% 캡</b><span>하더라도 최대 노출 절반으로 (인위적 속도 제한).</span></div>
          <div className="ftd-mini"><b>경고색 읽기</b><span>넓은 스프레드·큰 변동성 = 독사의 경고색 = 위험.</span></div>
        </div>
        <h4>흔한 오해 깨기</h4>
        <p>
          <b>&ldquo;바닥엔 패닉(capitulation)이 있어야 한다&rdquo;</b> → 아닙니다. 진짜 큰 약세장(1932·73~74·2002·2009)
          바닥은 그냥 <b>평범한 하락일</b>이었어요.<br />
          <b>&ldquo;데드크로스는 매도 신호&rdquo;</b> → 늦고 무작위예요. <span className="ftd-hl">&ldquo;신호가 아니라 조건(condition)&rdquo;</span>일 뿐, 비중 축소용.
        </p>
      </div>

      <div className="ftd-card">
        <h3>21일선 — Webby가 &ldquo;하나만 고르라면&rdquo; 쓰는 도구</h3>
        <p>21일 EMA를 FTD와 함께. <b>저점이 21일선 위 3일 연속 + 상승 마감 = 보조 확인</b>. 오래 21일선 위였다가 처음 종가 이탈하면 50일선까지 후퇴 예상.</p>
        <div className="ftd-quote">
          &ldquo;FTD만 쓰는 것도, 21일선만 쓰는 것도 아니다. 둘 다 쓴다. 하나만 골라야 한다면 — 21일선.&rdquo;
          <span>— Webby</span>
        </div>
        <h4>실전 철학</h4>
        <ol>
          <li><span className="ftd-hl">포용적 진입 + 우아한 후퇴</span> — 임계치를 빡세게 잡아도 실패율은 안 줄어요. 일찍 들어가고 손절선으로 관리.</li>
          <li><span className="ftd-hl">FTD엔 &ldquo;뭐라도 사라&rdquo;</span> — 현금이어도 1주는 사서 심리를 수비에서 공격으로. 단 실패 시 즉시 후퇴 전제.</li>
          <li><span className="ftd-hl">지적으로 정직하라</span> — 차트 복기 때 &ldquo;결과 알고 여기서 샀을 것&rdquo;이라는 자기기만 금지.</li>
        </ol>
      </div>

      <div className="ftd-tip">
        <h3>내 토스 ETF 모멘텀 봇에 적용하면</h3>
        <p>나스닥100·코스피200·S&P500 ETF를 가속 듀얼모멘텀으로 월말 리밸런싱하는 봇에, FTD와 200일선 인사이트를 &ldquo;타이밍 게이트&rdquo;로 씁니다.
          <b>200일선 체제 필터</b>로 선정 ETF가 선 아래면 비중 50% 캡 또는 국고채 대체.
          <b>FTD는 약세장 조기 재진입 게이트</b> — 국고채 도피 중일 때만 FTD를 감지해 월말을 안 기다리고 조기 복귀.
          <b>21일선 가드</b>로 보유 ETF가 종가 이탈하면 월중에도 방어.
          단, 한국 ETF 변동성에 맞게 임계치 재보정이 필요하고, FTD의 절반은 실패하니 손절 룰이 필수입니다.</p>
      </div>

      <a className="ftd-cta dark" href="https://ftd.shud26.com/now.html">지금 코스피 FTD 신호 보기 (실시간)</a>
      <a className="ftd-cta line" href="https://ftd.shud26.com/case-study.html">1978~2023 실전 케이스 33개</a>
      <a className="ftd-cta line" href="https://ftd.shud26.com/backtest.html">코스피 대형주로 직접 백테스트</a>

      <p style={{ color: "#9ca3af", fontSize: "0.8rem", textAlign: "center", marginTop: "2.5rem", lineHeight: 1.9 }}>
        한 개념, 네 가지 깊이 — 편한 단계부터 한 칸씩.<br />
        출처: Webby Rambles On (Mike Webster) · FTD Part 1 & 2 · William O&apos;Neil / IBD<br />
        투자 판단의 책임은 본인에게 있으며, 이 페이지는 학습 기록입니다.
      </p>
    </main>
  );
}
