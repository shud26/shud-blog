import { getPost, getAllSlugs } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: `${post.title} — shud.log`, description: post.description };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try {
    post = getPost(slug);
  } catch {
    notFound();
  }

  return (
    <article>
      {/* 헤더 */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.75rem" }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{post.date}</span>
          {post.tags.map((tag) => (
            <span key={tag} style={{
              fontSize: "0.75rem", color: "#6b7280",
              background: "#f3f4f6", padding: "0.1em 0.55em",
              borderRadius: "999px"
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className="prose">
        <MDXRemote source={post.content} />
      </div>

      {/* 하단 */}
      <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #e5e7eb" }}>
        <Link href="/" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none" }}>
          ← 목록으로
        </Link>
      </div>
    </article>
  );
}
