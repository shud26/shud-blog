import { getAllPosts, CATEGORIES } from "@/lib/posts";
import Link from "next/link";
import type { Metadata } from "next";

const CATEGORY_KEY = "유튜브정리";

export const metadata: Metadata = {
  title: "알상무 유튜브 정리 — shud.log",
  description:
    "주식 유튜브 영상을 보고 내가 이해한 대로 다시 정리한 공부 노트. 원본 영상 링크와 함께 두고 봅니다.",
};

export default function YoutubeNotesPage() {
  const meta = CATEGORIES.find((c) => c.key === CATEGORY_KEY);
  const posts = getAllPosts().filter((p) => p.category === CATEGORY_KEY);

  return (
    <div>
      <section style={{ marginBottom: "2.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.5rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta?.icon ?? "/icons/yt.png"}
            alt=""
            width={26}
            height={26}
            style={{ imageRendering: "pixelated" }}
          />
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            알상무 유튜브 정리
          </h1>
        </div>
        <p style={{ fontSize: "0.95rem", color: "#374151", lineHeight: 1.75, margin: "0 0 0.9rem" }}>
          주식 유튜브를 보다 보면 한 편이 한 시간을 훌쩍 넘깁니다. 매번 다 보고 있을 수가 없어서,
          듣고 나서 내가 이해한 만큼만 다시 적어두기로 했습니다. 여기 있는 글은 영상 그 자체가 아니라
          영상을 보고 남긴 제 공부 노트입니다.
        </p>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
          숫자와 발언은 제가 들은 대로 옮겼고, 해석과 그림은 제가 붙였습니다. 원본이 궁금하면 각 글에
          걸어둔 영상 링크로 가시는 편이 훨씬 정확합니다. 투자 조언이 아니고, 저는 자격 있는 투자
          자문가가 아닙니다.
        </p>
      </section>

      {posts.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>아직 정리한 영상이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {posts.map((post) => (
            <li key={post.slug} style={{ padding: "0.9rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <Link href={`/posts/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "1rem",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.45 }}>
                    {post.title}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {post.date}
                  </span>
                </div>
                {post.description && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#6b7280",
                      lineHeight: 1.6,
                      margin: "0.35rem 0 0",
                    }}
                  >
                    {post.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
        <Link href="/" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none" }}>
          ← 목록으로
        </Link>
      </div>
    </div>
  );
}
