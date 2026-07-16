import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://shud26.com";
  const posts = getAllPosts().map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : new Date(),
  }));
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/ftd` },
    { url: `${base}/about` },
    { url: `${base}/privacy` },
    { url: `${base}/contact` },
    ...posts,
  ];
}
