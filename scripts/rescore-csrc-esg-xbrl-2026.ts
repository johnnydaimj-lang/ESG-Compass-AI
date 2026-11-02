import type { RawMaterial } from "@/lib/contracts/pipeline";
import { scoreMaterialWithLlm } from "@/lib/pipeline/llm";
import { decideSelection, recommendReasonFor } from "@/lib/pipeline/score";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

async function main() {
  const articleUrl = "https://www.csrc.gov.cn/csrc/c101954/c7667691/content.shtml";
  const contents = readPublishedContents();
  const item = contents.find((entry) => entry.articleUrl === articleUrl);
  if (!item) throw new Error("未找到证监会可持续发展报告电子化规范条目");
  if (!item.pipeline) throw new Error("证监会规范条目缺少评分元数据");
  const existingPipeline = item.pipeline;

  const material: RawMaterial = {
    id: item.id,
    sourceId: "csrc-announcements",
    title: item.title,
    summary: item.summary,
    body: item.bodyZh || item.summary,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    articleUrl: item.articleUrl,
    publishedAt: item.publishedAt,
    contentType: item.contentType,
    region: item.region,
    esgTopic: item.esgTopic,
    sourceTier: "T1",
    editorialSource: true,
    content: item,
  };

  const runs = await scoreMaterialWithLlm(material);
  const decision = decideSelection(runs, "T1");
  item.recommended = decision.selected;
  item.recommendReason = recommendReasonFor(material, decision);
  item.pipeline = {
    ...existingPipeline,
    score: decision.displayScore,
    scoreThreshold: decision.threshold,
    scorePass: decision.selected,
    sourceTier: "T1",
  };

  writePublishedContents(contents);
  process.stdout.write(
    `rescored ${item.id} | score=${decision.displayScore} | selected=${decision.selected}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
