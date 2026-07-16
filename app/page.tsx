import { getAllPosts, getPostsByCategory } from "@/lib/posts";
import Link from "next/link";

export default function Home() {
  const groups = getPostsByCategory();
  const latest = getAllPosts().slice(0, 5);
  const total = getAllPosts().length;

  return (
    <div>
      {/* 인트로 */}
      <section style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.95rem", color: "#374151", lineHeight: 1.7, margin: 0 }}>
          1월에 파이썬이 뭔지 몰랐던 사람이 봇을 만들고, 게임을 만들고, 부수며 배운 것들.
          바이브코딩 기록 <strong>{total}편</strong>.
        </p>
      </section>

      {/* 최신 글 */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}>
          최신 글
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {latest.map((post) => (
            <li key={post.slug} style={{ padding: "0.6rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <Link href={`/posts/${post.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.4 }}>{post.title}</span>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap" }}>{post.date}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 카테고리별 목차 */}
      <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
        목차
      </h2>
      {groups.map((group) => (
        <section key={group.key} style={{ marginBottom: "2.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.15rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={group.icon} alt="" width={22} height={22} style={{ imageRendering: "pixelated" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{group.label}</h3>
            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{group.posts.length}</span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "0 0 0.75rem 1.6rem" }}>{group.desc}</p>
          <ul style={{ listStyle: "none", padding: "0 0 0 1.6rem", margin: 0 }}>
            {group.posts.map((post) => (
              <li key={post.slug} style={{ padding: "0.45rem 0", borderBottom: "1px solid #f3f4f6" }}>
                <Link href={`/posts/${post.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
                  <span style={{ fontSize: "0.9rem", lineHeight: 1.45, color: "#1f2937" }}>{post.title}</span>
                  <span style={{ fontSize: "0.72rem", color: "#b6bcc4", whiteSpace: "nowrap" }}>{post.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
