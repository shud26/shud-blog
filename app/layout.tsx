import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";

// 2026-10-06: 기기 기본 폰트 → Pretendard. 작업판·데일리 알파와 같은 글꼴로 맞췄다.
//   가변 폰트 하나(2MB)로 굵기 전부를 쓴다. next/font가 이 사이트에서 직접 내보낸다(외부 CDN 없음).
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shud26.com"),
  title: "shud.log",
  description: "바이브코딩으로 만드는 것들, 운영하면서 배운 것들",
  alternates: { canonical: "./" },
};

// 메뉴. 캘린더는 2026-08-21에 멈춰 있어서 10/6에 메뉴에서만 뺐다(페이지는 남아 있음).
const NAV = [
  { href: "/posts", label: "글" },
  { href: "/tools", label: "도구" },
  { href: "/alpha", label: "데일리 알파" },
  { href: "/yt", label: "유튜브 정리" },
  { href: "/journal", label: "일지" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8600828705366909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <div className="site">
          <header className="site-head">
            <a href="/" className="brand">
              <span className="brand-mark" aria-hidden="true">s</span>
              <span>
                <span className="brand-name">shud.log</span>
                <span className="brand-sub">바이브코딩 기록</span>
              </span>
            </a>
            <nav className="site-nav" aria-label="메뉴">
              {NAV.map((n) => (
                <a key={n.href} href={n.href}>{n.label}</a>
              ))}
            </nav>
          </header>
          <main className="page">{children}</main>
          <footer className="site-foot">
            <span>© {new Date().getFullYear()} shud.log</span>
            <a href="/about">소개</a>
            <a href="/privacy">개인정보처리방침</a>
            <a href="/contact">연락처</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
