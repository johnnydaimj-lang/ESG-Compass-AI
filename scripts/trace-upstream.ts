// 综合门户上游溯源：从门户 RSS 正文中提取官方/一手链接，写入 sourceRefs。
// 目前先接入 ESG Today，后续可通过 PORTALS 扩展其他门户。

import Parser from "rss-parser";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";
import { extractUpstreamLinks } from "@/lib/upstream";

interface PortalConfig {
  id: string;
  sourceMatch: string;
  rssUrl: string;
}

const PORTALS: PortalConfig[] = [
  {
    id: "esgtoday",
    sourceMatch: "ESG Today",
    rssUrl: "https://www.esgtoday.com/feed/",
  },
  {
    id: "bhrrc",
    sourceMatch: "Business & Human Rights",
    rssUrl: "https://www.business-humanrights.org/en/feeds/latest-news/3/",
  },
];

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sourceFilter = process.argv.find((arg) => arg.startsWith("--source="))?.split("=")[1];
  const contents = readPublishedContents();
  let scanned = 0;
  let matched = 0;
  let updated = 0;
  let refsAdded = 0;
  let withoutLinks = 0;

  for (const portal of PORTALS) {
    if (sourceFilter && portal.id !== sourceFilter) continue;
    const parser = new Parser({ timeout: 30_000 });
    let feed: Awaited<ReturnType<typeof parser.parseURL>>;
    try {
      feed = await parser.parseURL(portal.rssUrl);
    } catch (error) {
      process.stderr.write(
        `[trace-upstream] ${portal.id} feed failed: ${error instanceof Error ? error.message : String(error)}\n`
      );
      continue;
    }
    const byUrl = new Map<string, (typeof feed.items)[number]>();
    const byTitle = new Map<string, (typeof feed.items)[number]>();
    for (const rssItem of feed.items) {
      if (rssItem.link) byUrl.set(normalizeUrl(rssItem.link), rssItem);
      if (rssItem.title) byTitle.set(normalizeTitle(rssItem.title), rssItem);
    }

    for (const item of contents) {
      if (!item.sourceName.includes(portal.sourceMatch)) continue;
      scanned += 1;
      const articleUrl = item.articleUrl || item.sourceUrl;
      const rssItem =
        byUrl.get(normalizeUrl(articleUrl)) || byTitle.get(normalizeTitle(item.title));
      if (!rssItem) continue;
      matched += 1;
      const html = rssItem["content:encoded"] || rssItem.content || "";
      const refs = extractUpstreamLinks(html, articleUrl);
      if (refs.length === 0) {
        withoutLinks += 1;
        continue;
      }
      const existing = new Map(
        (item.sourceRefs || []).map((ref) => [normalizeUrl(ref.sourceUrl), ref])
      );
      let itemAdded = 0;
      let itemChanged = false;
      for (const ref of refs) {
        const key = normalizeUrl(ref.sourceUrl);
        const current = existing.get(key);
        if (current) {
          if (current.sourceName !== ref.sourceName || current.title !== ref.title) {
            current.sourceName = ref.sourceName;
            current.title = ref.title;
            itemChanged = true;
          }
          continue;
        }
        existing.set(key, { ...ref, publishedAt: item.publishedAt });
        itemAdded += 1;
        itemChanged = true;
      }
      if (!itemChanged) continue;
      item.sourceRefs = Array.from(existing.values()).slice(0, 5);
      refsAdded += itemAdded;
      updated += 1;
      if (dryRun) {
        process.stdout.write(
          `${item.id} | ${item.title.slice(0, 60)}\n`
          + refs.map((ref) => `  + ${ref.sourceName} | ${ref.sourceUrl}`).join("\n")
          + "\n"
        );
      }
    }
  }

  if (!dryRun) writePublishedContents(contents);
  process.stdout.write(
    `upstream traced (${dryRun ? "dry-run" : "write"}): scanned=${scanned} matched=${matched} `
    + `updated=${updated} refsAdded=${refsAdded} withoutLinks=${withoutLinks}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`[trace-upstream] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

export {};
