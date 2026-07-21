import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shud26.com"),
  title: "shud.log",
  description: "바이브코딩으로 만드는 것들, 운영하면서 배운 것들",
  alternates: { canonical: "./" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8600828705366909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 1.25rem" }}>
          <header style={{ padding: "2.5rem 0 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}>
            <a href="/" style={{ textDecoration: "none", color: "#111" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>shud.log</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
                바이브코딩 기록
              </div>
            </a>
            <nav style={{ display: "flex", gap: "1rem", fontSize: "0.88rem" }}>
              <a href="/" style={{ textDecoration: "none", color: "#374151", fontWeight: 600 }}>글</a>
              <a href="/ftd" style={{ textDecoration: "none", color: "#374151", fontWeight: 600 }}>FTD 신호기</a>
              <a href="/calendar" style={{ textDecoration: "none", color: "#374151", fontWeight: 600 }}>캘린더</a>
            </nav>
          </header>
          <main style={{ padding: "2.5rem 0 5rem" }}>{children}</main>
          <footer style={{ borderTop: "1px solid #e5e7eb", padding: "1.5rem 0 2.5rem", fontSize: "0.8rem", color: "#9ca3af", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span>© {new Date().getFullYear()} shud.log</span>
            <a href="/about" style={{ color: "#9ca3af" }}>소개</a>
            <a href="/privacy" style={{ color: "#9ca3af" }}>개인정보처리방침</a>
            <a href="/contact" style={{ color: "#9ca3af" }}>연락처</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
