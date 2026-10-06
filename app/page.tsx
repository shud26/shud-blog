import { getAllPosts, getPostsByCategory, CATEGORIES } from "@/lib/posts";
import { TOOLS } from "@/lib/tools";
import Link from "next/link";

// 2026-10-06 리디자인: 제목 89개를 한 줄씩 나열하던 홈을
//   소개 → 숫자 띠 → 최신 글 카드 → 카테고리 타일 → 만든 도구 순으로 바꿨다.
//   전체 목록은 /posts 로 옮겼다.
export default function Home() {
  const all = getAllPosts();
  const groups = getPostsByCategory();
  const latest = all.slice(0, 3);
  const iconOf = (cat?: string) => CATEGORIES.find((c) => c.key === cat)?.icon;
  const first = all.length ? all[all.length - 1].date.slice(0, 7).replace("-", ".") : "";

  return (
    <div className="home wide">
      <section className="hero">
        <h1>1월에 파이썬이 뭔지 몰랐던 사람이<br />봇을 만들고, 부수며 배운 것들</h1>
        <p>매매봇·자동화·온체인 실험을 직접 굴려보고 숫자로 남기는 바이브코딩 기록.</p>
        <div className="strip">
          <div><div className="k">쓴 글</div><div className="n">{all.length}<small>편</small></div></div>
          <div><div className="k">카테고리</div><div className="n">{groups.length}<small>개</small></div></div>
          <div><div className="k">만든 도구</div><div className="n">{TOOLS.length}<small>개</small></div></div>
          <div><div className="k">기록 시작</div><div className="n">{first}</div></div>
        </div>
      </section>

      <section>
        <div className="sec-h"><h2>최신 글</h2><Link href="/posts">전체 보기 →</Link></div>
        <div className="cards">
          {latest.map((p) => {
            const icon = iconOf(p.category);
            return (
              <Link key={p.slug} href={`/posts/${p.slug}`} className="card">
                <div className="meta">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {icon && <img src={icon} alt="" width={18} height={18} />}
                  <span>{p.category ?? "기록"}</span>
                  <span>·</span>
                  <span>{p.date}</span>
                </div>
                <div className="t">{p.title}</div>
                {p.description && <div className="d">{p.description}</div>}
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="sec-h"><h2>카테고리</h2><Link href="/posts">전체 목록 →</Link></div>
        <div className="tiles">
          {groups.map((g) => (
            <Link key={g.key} href={`/posts#${encodeURIComponent(g.key)}`} className="tile">
              <div className="top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.icon} alt="" width={22} height={22} />
                <span className="name">{g.label}</span>
                <span className="cnt">{g.posts.length}</span>
              </div>
              <div className="d">{g.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="sec-h"><h2>만든 도구</h2><Link href="/tools">전체 보기 →</Link></div>
        <div className="tools">
          {TOOLS.slice(0, 6).map((t) => (
            <a key={t.href} href={t.href} className="tool">
              <span className="ic" style={{ background: t.color }} aria-hidden="true">{t.mark}</span>
              <span className="tx"><span className="name">{t.name}</span><span className="d">{t.desc}</span></span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
