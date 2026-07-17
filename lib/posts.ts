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
export const CATEGORIES: Category[] = [
  { key: "게임개발", label: "게임 개발", icon: "/icons/game.png", desc: "코인던전 — 웹 게임 만들기" },
  { key: "트레이딩봇", label: "트레이딩 봇", icon: "/icons/bot.png", desc: "매매봇 설계·운영·결산 기록" },
  { key: "에어드랍파밍", label: "에어드랍 · 파밍", icon: "/icons/farm.png", desc: "온체인 파밍 세팅과 비용" },
  { key: "인프라자동화", label: "인프라 · 자동화", icon: "/icons/infra.png", desc: "맥미니 서버, 옵시디언, 파이프라인" },
  { key: "트러블슈팅", label: "트러블슈팅", icon: "/icons/bug.png", desc: "삽질과 버그 해결 기록" },
  { key: "입문에세이", label: "입문 · 에세이", icon: "/icons/essay.png", desc: "바이브코딩 여정과 생각" },
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
