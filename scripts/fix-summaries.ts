// 一次性修复：补全正文可核实的截断摘要，并规范精选摘要的句末标点。

import type { ContentItem } from "@/lib/contracts/content";
import { buildDailyReport } from "@/lib/pipeline/daily";
import { getLlmConfig } from "@/lib/pipeline/llm";
import { cleanSummaryText } from "@/lib/pipeline/text";
import {
  readPublishedContents,
  readStories,
  writeDaily,
  writePublishedContents,
} from "@/lib/publication-store";

const REPAIRS: Record<string, Partial<ContentItem>> = {
  "src-140fzjh": {
    summary:
      "Brazil's Securities and Exchange Commission (CVM) launched a new public consultation on its upcoming sustainability and climate-related reporting regime, seeking feedback on mandatory disclosure, phasing in mandatory obligations over time, or requiring only climate reporting.",
    summaryZh:
      "巴西证券交易委员会（CVM）启动新一轮公众咨询，讨论其即将实施的可持续与气候相关报告制度，并征求对强制披露、逐步设定义务或仅强制气候报告等方案的意见。",
  },
  "src-tcly9h": {
    summary:
      "Bank of America, the Sustainable Markets Initiative (SMI), and Eurazeo launched the Lighthouse Initiative to finance nature restoration and biodiversity protection projects, with $40 million in initial commitments.",
    summaryZh:
      "美国银行、可持续市场倡议（SMI）与法国投资公司Eurazeo共同推出“灯塔倡议”，旨在为自然修复和生物多样性保护项目融资，基金初始承诺规模为4000万美元。",
  },
  "src-n8jukm": {
    summary:
      "The UN-backed Green Climate Fund (GCF) approved nearly $2 billion in climate finance for 21 projects at its board meeting, bringing its 2026 approvals to a record $3.3 billion.",
    summaryZh:
      "联合国支持的绿色气候基金（GCF）在董事会会议上批准为21个项目提供近20亿美元气候融资，使其2026年批准总额达到创纪录的33亿美元。",
  },
  "src-qvlbt2": {
    summary:
      "The California Office of Administrative Law (OAL) approved the state's new corporate greenhouse gas and climate risk disclosure regulations, setting November 10, 2026 as the deadline for the first greenhouse gas emissions reports.",
    summaryZh:
      "加利福尼亚州行政法办公室（OAL）已批准该州新的企业温室气体与气候风险披露法规，并将2026年11月10日定为首次温室气体排放报告的截止日期。",
  },
  "src-esgtoday-eu-publishes-final-revised-european-sustainabili-7ffa": {
    summary:
      "The European Commission published the finalized revised European Sustainability Reporting Standards (ESRS) for companies covered by the Corporate Sustainability Reporting Directive (CSRD) and its voluntary reporting standard for smaller companies in the Official Journal of the EU.",
    summaryZh:
      "欧盟委员会已在欧盟官方公报发布最终修订版欧洲可持续发展报告标准（ESRS），适用于《企业可持续发展报告指令》（CSRD）覆盖的企业，并同时发布面向较小企业的自愿报告标准。",
  },
  "src-bhrrc-latest-from-invisibility-to-protection-ilo-adopts-landm-074a": {
    title: "From invisibility to protection: ILO adopts landmark protections for platform workers",
    titleZh: "从隐形到保护：国际劳工组织通过具有里程碑意义的平台工人保护措施",
    summary: "The International Labour Organization (ILO) adopted landmark protections for platform workers.",
    summaryZh: "国际劳工组织（ILO）通过了针对平台工人的里程碑式保护措施。",
  },
  "src-1gnyckx": {
    titleZh: "联合国秘书长将发布全球生物多样性承诺进展报告",
    summaryZh: "联合国秘书长安东尼奥·古特雷斯将正式发布关于2022年全球生物多样性承诺进展情况的报告，评估各国落实全球生物多样性目标的进展。",
  },
};

function ensureSentenceEnding(value: string): string {
  const text = String(value || "").trim();
  if (!text || /[。！？.!?]$/.test(text)) return text;
  return text + (/[\u3400-\u9fff]/.test(text) ? "。" : ".");
}

interface SummaryRepair {
  item: ContentItem;
}

function needsSummaryRewrite(item: ContentItem): boolean {
  const summary = String(item.summaryZh || "").trim();
  if (!summary) return false;
  const hasEllipsis = summary.includes("……") || /\.{3,}/.test(summary);
  if (summary === item.titleZh && !hasEllipsis) return false;
  return !/[。！？.!?]$/.test(summary) || hasEllipsis;
}

async function rewriteSummaries(items: SummaryRepair[]): Promise<Map<string, string>> {
  const output = new Map<string, string>();
  const config = getLlmConfig();
  if (!config || items.length === 0) return output;
  const llmConfig = config;
  const batches: SummaryRepair[][] = [];
  for (let index = 0; index < items.length; index += 16) {
    batches.push(items.slice(index, index + 16));
  }
  let cursor = 0;
  async function worker() {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      try {
        const res = await fetch(`${llmConfig.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmConfig.apiKey}` },
          body: JSON.stringify({
            model: llmConfig.model,
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "你是中文 ESG 编辑。根据标题、英文摘要和已有中文片段，为每条内容写 1-2 句完整、准确、简洁的中文摘要，不超过 180 字。不得编造未提供的数字、日期、机构或结论，不得用逗号或半句结尾。只输出合法 JSON：{\"items\":[{\"id\":\"原 id\",\"summary\":\"完整中文摘要\"}]}。",
              },
              {
                role: "user",
                content: JSON.stringify({
                  items: batch.map(({ item }) => ({
                    id: item.id,
                    title: item.title,
                    titleZh: item.titleZh,
                    summary: item.summary,
                    partialSummaryZh: item.summaryZh,
                  })),
                }),
              },
            ],
          }),
          signal: AbortSignal.timeout(120_000),
        });
        if (!res.ok) continue;
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content || "";
        const json = text.match(/\{[\s\S]*\}/)?.[0];
        if (!json) continue;
        const parsed = JSON.parse(json) as { items?: Array<{ id?: unknown; summary?: unknown }> };
        for (const entry of parsed.items || []) {
          const id = String(entry.id || "");
          const summary = ensureSentenceEnding(String(entry.summary || "").trim());
          if (id && summary.length >= 10 && summary.length <= 300 && /[\u3400-\u9fff]/.test(summary)) {
            output.set(id, summary);
          }
        }
      } catch {
        // 单批失败时保留原文，后续由标题兜底。
      }
    }
  }
  await Promise.all([worker(), worker()]);
  return output;
}

function syncRecommendReason(item: ContentItem): void {
  const reason = String(item.recommendReason || "");
  const marker = reason.indexOf("信息价值较高");
  if (!item.summaryZh || marker < 0) return;
  item.recommendReason = ensureSentenceEnding(item.summaryZh) + reason.slice(marker);
}

async function main() {
  const contents = readPublishedContents();
  let fixed = 0;
  let repaired = 0;
  const rewriteCandidates: SummaryRepair[] = [];
  for (const item of contents) {
    const repair = REPAIRS[item.id];
    if (repair) {
      Object.assign(item, repair);
      syncRecommendReason(item);
      repaired += 1;
    }
    const raw = String(item.summary || "").trim();
    const cleaned = cleanSummaryText(raw);
    if (cleaned !== raw) {
      item.summary = cleaned;
      item.summaryZh = "";
      fixed += 1;
    } else if (!raw && item.title) {
      item.summary = item.title;
      item.summaryZh = "";
      fixed += 1;
    }
    if (!String(item.summaryZh || "").trim() && item.titleZh) {
      item.summaryZh = item.titleZh;
      fixed += 1;
    }
    const titleOnly = Boolean(item.summaryZh && item.titleZh && item.summaryZh.trim() === item.titleZh.trim());
    if (titleOnly && !needsSummaryRewrite(item)) {
      item.summaryZh = ensureSentenceEnding(item.summaryZh || "");
    } else if (needsSummaryRewrite(item)) {
      rewriteCandidates.push({
        item,
      });
    }
    if (item.recommended) {
      item.summary = ensureSentenceEnding(item.summary);
      item.summaryZh = ensureSentenceEnding(item.summaryZh || "");
    }
  }
  const rewritten = await rewriteSummaries(rewriteCandidates);
  for (const { item } of rewriteCandidates) {
    item.summaryZh = rewritten.get(item.id)
      || ensureSentenceEnding(item.titleZh || item.title);
    if (item.recommended) syncRecommendReason(item);
    fixed += 1;
  }
  writePublishedContents(contents);
  writeDaily(buildDailyReport(contents, readStories(), new Date()));
  process.stdout.write(
    `summaries fixed: repaired=${repaired} fixed=${fixed} items=${contents.length}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`[fix-summaries] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
