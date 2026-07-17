import { getAllPosts } from "@/lib/posts";

export async function GET() {
  const base = "https://shud26.com";
  const items = getAllPosts()
    .slice(0, 30)
    .map((p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${base}/posts/${p.slug}</link>
      <guid>${base}/posts/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
    </item>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>shud.log</title>
    <link>${base}</link>
    <description>바이브코딩으로 만드는 것들, 운영하면서 배운 것들</description>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
