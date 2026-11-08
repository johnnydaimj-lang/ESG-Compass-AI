import { generateRecommendReasonsWithLlm } from "@/lib/pipeline/llm";
import { buildDailyReport } from "@/lib/pipeline/daily";
import { hasEditorialFirstPerson } from "@/lib/pipeline/summary-quality";
import {
  readPublishedContents,
  readStories,
  writeDaily,
  writePublishedContents,
} from "@/lib/publication-store";

async function main() {
  const contents = readPublishedContents();
  const selected = contents.filter((item) => item.recommended);
  const reasons = await generateRecommendReasonsWithLlm(selected.map((item) => ({
    id: item.id,
    title: item.titleZh || item.title,
    summary: item.summaryZh || item.summary,
    score: item.pipeline?.score ?? 0,
    contentType: item.contentType,
    region: item.region,
    sourceName: item.sourceName,
    fact: item.pipeline?.fact,
  })));

  let generated = 0;
  let cleared = 0;
  for (const item of contents) {
    if (!item.recommended) {
      if (item.recommendReason) cleared += 1;
      item.recommendReason = "";
      continue;
    }
    const reason = reasons.get(item.id);
    if (reason) {
      item.recommendReason = reason;
      generated += 1;
    } else if (!item.recommendReason || hasEditorialFirstPerson(item.recommendReason) || /综合评分|评分较高|推荐理由|本文|这篇文章/.test(item.recommendReason)) {
      const summary = String(item.summaryZh || item.summary || item.titleZh || item.title).trim();
      const first = summary.split(/[。！？]/)[0]?.trim() || "";
      item.recommendReason = first && !hasEditorialFirstPerson(first) ? `${first}。` : "";
    }
  }

  writePublishedContents(contents);
  writeDaily(buildDailyReport(contents, readStories(), new Date()));
  process.stdout.write(
    `recommend reasons regenerated=${generated} cleared=${cleared} selected=${selected.length}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`[recommend-reasons] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
