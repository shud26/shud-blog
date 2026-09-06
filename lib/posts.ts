import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

// YAML이 date를 JS Date로 파싱 → YYYY-MM-DD 문자열로 정규화 (KST)
function fmtDate(d: unknown): string {
  if (!d) return "";
  const dt = new Date(d as string);
  if (isNaN(dt.getTime())) return String(d);
  return new Date(dt.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  series?: string;
  seriesOrder?: number;
  category?: string;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(".mdx", "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: fmtDate(data.date),
        tags: data.tags ?? [],
        series: data.series,
        seriesOrder: data.seriesOrder,
        category: data.category,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: fmtDate(data.date),
    tags: data.tags ?? [],
    series: data.series,
    seriesOrder: data.seriesOrder,
    category: data.category,
    content,
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(".mdx", ""));
}

// ── 카테고리 목차 시스템 ──
export interface Category {
  key: string;
  label: string;
  icon: string; // 로컬 FLUX로 생성한 도트 아이콘 (public/icons/)
  desc: string;
}

// 표시 순서 = 이 배열 순서. 신설 카테고리는 여기 추가만 하면 됨.
//
// ⚠️ 여기 key 는 글 프론트매터의 `category:` 값과 **글자 그대로** 같아야 한다.
//    2026-09-01에 카테고리를 11개에서 4개로 통합하면서 mdx 는 전부 고쳤는데
//    이 배열을 안 고쳐서, 76편 중 어느 것도 매칭되지 않았다.
//    결과적으로 홈의 "목차"가 통째로 비었고 /yt 도 "아직 정리한 영상이 없습니다"만 떴다.
//    조용히 비는 종류의 버그라 배포가 성공해도 알 수가 없다.
//    → 카테고리를 바꿀 때는 mdx 와 이 배열을 **항상 같이** 고칠 것.
export const CATEGORIES: Category[] = [
  { key: "봇 만들기", label: "봇 만들기", icon: "/icons/bot.png", desc: "매매봇·자동화 봇을 만들고 굴린 기록" },
  { key: "공부 기록", label: "공부 기록", icon: "/icons/essay.png", desc: "영상과 자료를 보고 내가 이해한 대로 다시 쓴 노트" },
  { key: "삽질 기록", label: "삽질 기록", icon: "/icons/bug.png", desc: "막힌 지점과 그걸 어떻게 뚫었는지" },
  { key: "온체인", label: "온체인", icon: "/icons/farm.png", desc: "에어드랍·민팅·온체인 실험과 실제 비용" },
];

export interface CategoryGroup extends Category {
  posts: PostMeta[];
}

/** 카테고리별로 묶어 반환 (각 그룹 내부는 최신순). 글 없는 카테고리는 제외. */
export function getPostsByCategory(): CategoryGroup[] {
  const all = getAllPosts();
  return CATEGORIES
    .map((c) => ({ ...c, posts: all.filter((p) => p.category === c.key) }))
    .filter((g) => g.posts.length > 0);
}

/** 본문에서 첫 마크다운 이미지 URL 추출 (og:image용). 없으면 기본 이미지. */
export function getPostImage(content: string): string {
  const m = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : "/images/og-default.png";
}
