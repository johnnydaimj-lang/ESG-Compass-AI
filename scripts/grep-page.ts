// 抓取页面原始 HTML，按关键词打印匹配行（用于定位动态加载的数据）。

async function main() {
  const url = process.argv[2];
  const pattern = process.argv[3] || "";
  if (!url) {
    console.log("用法: tsx scripts/grep-page.ts <url> [pattern]");
    return;
  }
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, signal: AbortSignal.timeout(25_000) });
  const html = await res.text();
  console.log(`status=${res.status} len=${html.length}`);
  for (const line of html.split("\n")) {
    if (!pattern || line.includes(pattern)) console.log(line.trim().slice(0, 500));
  }
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
