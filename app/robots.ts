import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /alpha 는 AI가 매일 자동으로 만드는 요약 페이지라 검색에서 뺀다(AdSense 심사 사이트와 섞지 않기)
    rules: { userAgent: "*", allow: "/", disallow: "/alpha/" },
    sitemap: "https://shud26.com/sitemap.xml",
  };
}
