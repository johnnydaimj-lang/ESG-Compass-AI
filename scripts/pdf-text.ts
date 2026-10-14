// 极简 PDF 文本提取：解压流并抓取 Tj/TJ 文本，用于读 SEC 调查报告标题与正文。

import { inflateSync } from "node:zlib";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.log("用法: tsx scripts/pdf-text.ts <url>");
    return;
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    signal: AbortSignal.timeout(25_000),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const s = buf.toString("latin1");
  const parts: string[] = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    try {
      const inflated = inflateSync(Buffer.from(m[1], "latin1")).toString("latin1");
      for (const t of inflated.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)) parts.push(t[1]);
      for (const t of inflated.matchAll(/\[((?:[^\][]|\\.)*)\]\s*TJ/g)) {
        parts.push([...t[1].matchAll(/\(((?:[^()\\]|\\.)*)\)/g)].map((x) => x[1]).join(""));
      }
    } catch {
      // skip non-flate streams
    }
  }
  const text = parts.join(" ").replace(/\\([()\\])/g, "$1").replace(/\s+/g, " ").trim();
  console.log(`status=${res.status} bytes=${buf.length}`);
  console.log(text.slice(0, 2200));
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
