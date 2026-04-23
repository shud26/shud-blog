import { getAllPosts } from "@/lib/posts";
import Link from "next/link";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      <ul style={{ listStyle: "none" }}>
        {posts.map((post) => (
          <li key={post.slug} style={{ borderBottom: "1px solid #e5e7eb", padding: "1.5rem 0" }}>
            <Link href={`/posts/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
                <span style={{ fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 }}>{post.title}</span>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af", whiteSpace: "nowrap" }}>{post.date}</span>
              </div>
              {post.description && (
                <p style={{ marginTop: "0.35rem", fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>
                  {post.description}
                </p>
              )}
              {post.tags.length > 0 && (
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {post.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: "0.75rem", color: "#6b7280",
                      background: "#f3f4f6", padding: "0.1em 0.55em",
                      borderRadius: "999px"
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
