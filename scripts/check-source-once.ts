import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  closeBrowserRender,
  collectBrowserRenderSource,
  collectCrossrefSource,
  collectEuPressCornerSource,
  collectRssSource,
  collectSecInvestreports,
  collectWebpageSource,
  collectWorldBankSource,
  type SourceConfig,
} from "@/lib/pipeline/collect";

const sourceId = process.argv.find((arg) => arg.startsWith("--source="))?.split("=")[1];
if (!sourceId) {
  process.stderr.write("用法：npm run source:check -- --source=<source-id>\n");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(resolve(process.cwd(), "data", "sources.json"), "utf8")) as {
  sources?: SourceConfig[];
};
const source = (raw.sources || []).find((item) => item.id === sourceId);
if (!source) {
  throw new Error(`未找到信源：${sourceId}`);
}
const selectedSource: SourceConfig = source;

async function collect(): Promise<Awaited<ReturnType<typeof collectRssSource>>> {
  switch (selectedSource.type.toLowerCase()) {
    case "rss":
      return collectRssSource(selectedSource);
    case "webpage":
      return collectWebpageSource(selectedSource);
    case "browser-render":
      return collectBrowserRenderSource(selectedSource);
    case "sec-investreport":
      return collectSecInvestreports(selectedSource);
    case "api":
      return collectCrossrefSource(selectedSource);
    case "worldbank":
      return collectWorldBankSource(selectedSource);
    case "eu-presscorner":
      return collectEuPressCornerSource(selectedSource);
    default:
      throw new Error(`暂不支持单独检查 ${selectedSource.type} 适配器`);
  }
}

collect()
  .then((items) => {
    process.stdout.write(`${selectedSource.id} | ${items.length} 条\n`);
    for (const item of items.slice(0, 10)) {
      process.stdout.write(`- ${item.publishedAt.slice(0, 10)} | ${item.title}\n  ${item.articleUrl}\n`);
    }
  })
  .catch((error) => {
    process.stderr.write(`检查失败：${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeBrowserRender();
    setTimeout(() => process.exit(process.exitCode || 0), 250);
  });
