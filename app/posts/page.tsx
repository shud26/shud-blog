import { getAllPosts, getPostsByCategory } from "@/lib/posts";
import Link from "next/link";

export const metadata = { title: "전체 글 — shud.log" };

// 2026-10-06: 홈에 있던 카테고리별 전체 목차를 여기로 옮겼다.
export default function PostsPage() {
  const groups = getPostsByCategory();
  const total = getAllPosts().length;
  return (
    <div className="toc">
      <div>
        <h1>전체 글</h1>
        <p className="lead">바이브코딩 기록 {total}편. 카테고리별로 최신순.</p>
      </div>
      {groups.map((g) => (
        <section key={g.key} id={g.key}>
          <div className="grp-h">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.icon} alt="" width={22} height={22} />
            <h2>{g.label}</h2>
            <span>{g.posts.length}</span>
          </div>
          <p className="grp-d">{g.desc}</p>
          <ul>
            {g.posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/posts/${p.slug}`}>
                  <span>{p.title}</span>
                  <span className="dt">{p.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
