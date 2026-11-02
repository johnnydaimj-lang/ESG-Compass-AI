import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright-core";
import { extractArticleMetadata, extractWebpageMaterials, type SourceConfig } from "@/lib/pipeline/collect";

const url = process.argv.find((arg) => arg.startsWith("--url="))?.slice(6);
const sourceId = process.argv.find((arg) => arg.startsWith("--source="))?.split("=")[1];
if (!url) {
  process.stderr.write("用法：npm run page:inspect -- --url=<https://example.com>\n");
  process.exit(1);
}

const edgePaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const executablePath = edgePaths.find((path) => existsSync(path));
if (!executablePath) throw new Error("未找到 Microsoft Edge");

const source = sourceId
  ? (JSON.parse(readFileSync(resolve(process.cwd(), "data", "sources.json"), "utf8")) as { sources?: SourceConfig[] })
    .sources?.find((item) => item.id === sourceId)
  : undefined;

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
  try {
    await page.goto(url!, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(7_000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1_000);
    const html = await page.content();
    const links = await page.locator("a").evaluateAll((nodes) => nodes
      .map((node) => ({
        href: (node as HTMLAnchorElement).href,
        text: (node.textContent || "").replace(/\s+/g, " ").trim(),
      parentText: ((node.parentElement?.textContent || "").replace(/\s+/g, " ").trim()).slice(0, 260),
      parentClass: node.parentElement?.className || "",
      html: node.outerHTML.slice(0, 1200),
      }))
      .filter((item) => item.href.startsWith("http") && item.text.length >= 12));
    const unique = [...new Map(links.map((link) => [link.href, link])).values()].slice(0, 60);
    const candidates = source ? [] as Array<Record<string, unknown>> : undefined;
    if (source) {
      const extracted = extractWebpageMaterials(html, source, true);
      for (const item of extracted.slice(0, 10)) {
        const articleHtml = item.articleUrl
          ? await page.request.get(item.articleUrl).then((response) => response.text()).catch(() => "")
          : "";
        candidates!.push({
          title: item.title,
          publishedAt: item.publishedAt,
          articleUrl: item.articleUrl,
          metadata: articleHtml ? extractArticleMetadata(articleHtml) : null,
        });
      }
    }
    process.stdout.write(`${JSON.stringify(candidates || unique, null, 2)}\n`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
