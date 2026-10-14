// 简易网页检索：优先抓 DuckDuckGo，其次必应，输出政府站点结果。

async function ddg(query: string): Promise<string[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  const html = await res.text();
  const out: string[] = [];
  for (const m of html.matchAll(/uddg=([^"&]+)/g)) {
    try {
      const link = decodeURIComponent(m[1]);
      if (!/duckduckgo\.com/.test(link)) out.push(link);
    } catch {
      // ignore
    }
  }
  return out;
}

async function bing(query: string): Promise<string[]> {
  const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&count=30`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  const html = await res.text();
  const links = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  return links.filter((l) => !/bing\.com|microsoft\.com|msn\.com/.test(l));
}

async function main() {
  const query = process.argv.slice(2).join(" ");
  if (!query) {
    console.log("用法: tsx scripts/web-search.ts <关键词>");
    return;
  }
  const results = [...(await ddg(query)), ...(await bing(query))];
  const unique = [...new Set(results)];
  const gov = unique.filter((l) => /mof\.gov\.cn|gov\.cn|sec\.gov|chinatax|kjs\./.test(l));
  for (const link of (gov.length ? gov : unique).slice(0, 25)) console.log(link);
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
