// 抓取一个页面，列出其中的链接（可按关键词过滤）。

async function main() {
  const url = process.argv[2];
  const keyword = process.argv[3] || "";
  if (!url) {
    console.log("用法: tsx scripts/fetch-links.ts <url> [keyword]");
    return;
  }
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
  const html = await res.text();
  console.log(`status=${res.status} len=${html.length}`);
  const items = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{1,200}?)<\/a>/g)].map((m) => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(),
  }));
  const filtered = keyword ? items.filter((i) => i.text.includes(keyword) || i.href.includes(keyword)) : items;
  for (const item of filtered.slice(0, 40)) console.log(`${item.text} => ${item.href}`);
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
