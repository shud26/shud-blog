import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shud.log",
  description: "바이브코딩으로 만드는 것들, 운영하면서 배운 것들",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 1.25rem" }}>
          <header style={{ padding: "2.5rem 0 2rem", borderBottom: "1px solid #e5e7eb" }}>
            <a href="/" style={{ textDecoration: "none", color: "#111" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>shud.log</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
                바이브코딩 기록
              </div>
            </a>
          </header>
          <main style={{ padding: "2.5rem 0 5rem" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
