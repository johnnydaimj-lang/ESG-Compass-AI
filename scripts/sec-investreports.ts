// 测试 SEC 调查报告适配器：抓取并打印报告条目。

import { collectSecInvestreports } from "@/lib/pipeline/collect";

async function main() {
  const source = {
    id: "sec-investreports",
    name: "SEC 调查报告（Investigation Reports）",
    url: "https://www.sec.gov/enforcement-litigation/reports-investigations",
    type: "sec-investreport",
    contentType: "政策" as const,
    region: "美国",
    language: "en",
  };
  const items = await collectSecInvestreports(source);
  console.log(`items=${items.length}`);
  for (const it of items.slice(0, 8)) {
    console.log(`${it.publishedAt.slice(0, 10)} | ${it.title.slice(0, 72)}`);
  }
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
