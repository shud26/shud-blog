import { getPost, getAllSlugs, getAllPosts, getPostImage } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const image = getPostImage(post.content);
  return {
    title: `${post.title} — shud.log`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [image] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try {
    post = getPost(slug);
  } catch {
    notFound();
  }

  const related = getAllPosts()
    .filter((x) => x.slug !== slug && x.category === post.category)
    .slice(0, 3);

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

      {/* 관련 글 */}
      {related.length > 0 && (
        <div style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.9rem" }}>
            이어서 읽기
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {related.map((r) => (
              <li key={r.slug} style={{ margin: "0 0 0.7rem" }}>
                <Link href={`/posts/${r.slug}`} style={{ textDecoration: "none" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111" }}>{r.title}</span>
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginLeft: "0.5rem" }}>{r.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 하단 */}
      <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
        <Link href="/" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none" }}>
          ← 목록으로
        </Link>
      </div>
    </article>
  );
}
