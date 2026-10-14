// 抓取一个页面并输出标题与正文文本（用于核对官方发文内容）。

function strip(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.log("用法: tsx scripts/fetch-page.ts <url>");
    return;
  }
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
  const html = await res.text();
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  console.log(`status=${res.status}`);
  console.log(`title=${title}`);
  console.log(`text=${strip(html).slice(0, 1600)}`);
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
