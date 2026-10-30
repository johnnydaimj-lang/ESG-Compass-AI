import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { WeeklyIssue } from "@/lib/wechat/types";
import type {
  ContentOpsCategory,
  ContentSignal,
  ContentSourceGrade,
} from "@/lib/content-ops/types";
import {
  appendContentSignals,
  signalIdFor,
} from "@/lib/content-ops/signal-store";
import { hasFlag, readArg } from "./_args";

type WeeklyStory = WeeklyIssue["stories"][number];

const OFFICIAL_HOSTS = [
  "hkex.com.hk",
  "ifrs.org",
  "eib.org",
  "europa.eu",
  "un.org",
  "worldbank.org",
  "oecd.org",
  "gov.cn",
  "gov.uk",
  "sec.gov",
];

function sourceGradeFor(url: string): ContentSourceGrade {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OFFICIAL_HOSTS.some((official) => host === official || host.endsWith(`.${official}`))
      ? "A"
      : "B";
  } catch {
    return "C";
  }
}

function categoryFor(story: WeeklyStory): ContentOpsCategory {
  const label = `${story.category} ${story.title} ${story.originalTitle}`.toLowerCase();
  if (label.includes("研究") || label.includes("报告")) return "research";
  if (label.includes("政策") || label.includes("监管") || label.includes("披露规则")) return "policy";
  if (label.includes("资本") || label.includes("融资") || label.includes("市场")) return "market";
  if (label.includes("绿色营销") || label.includes("企业")) return "corporate";
  return "hotspot";
}

function regionFor(story: WeeklyStory): string {
  if (story.url.includes("hkex.com.hk")) return "香港";
  if (/欧盟|European|EU/i.test(`${story.title} ${story.originalTitle}`)) return "欧盟";
  return "全球";
}

function tagsFor(story: WeeklyStory, category: ContentOpsCategory): string[] {
  return [...new Set([category, ...story.stakeholders, ...story.watchpoints.map(() => "watchpoint")])];
}

function potentialAnglesFor(category: ContentOpsCategory): string[] {
  switch (category) {
    case "policy":
      return ["机制解读：规则阶段、适用范围与执行证据发生了什么变化？"];
    case "research":
      return ["研究解读：这项研究改变了什么既有判断，它的方法边界在哪里？"];
    case "market":
      return ["资本配置：资金流向、项目筛选和风险定价是否发生了可验证的变化？"];
    case "corporate":
      return ["执行落差：企业承诺、产品表述与可核验证据之间还有哪些距离？"];
    default:
      return ["趋势判断：这是孤立事件，还是某个结构性变化的早期信号？"];
  }
}

function buildSignal(issue: WeeklyIssue, issueKey: string, story: WeeklyStory, detectedAt: string): ContentSignal {
  const sourceGrade = sourceGradeFor(story.url);
  const isPrimarySource = sourceGrade === "A";
  const category = categoryFor(story);
  const evidenceCompleteness = isPrimarySource ? 1 : 0.7;
  const materiality = category === "policy" || category === "research" ? 0.82 : 0.68;
  const novelty = 0.7;
  const durability = category === "policy" || category === "research" ? 0.82 : 0.6;
  const priority = materiality >= 0.8 ? "P1" : "P2";
  const recordId = `${issueKey}:${story.number}`;

  return {
    schemaVersion: "content-signal/v1",
    signalId: signalIdFor({
      title: story.title,
      sourceUrl: story.url,
      publishedAt: story.sourceDate,
      recordId,
    }),
    detectedAt,
    title: story.title,
    fact: story.fact,
    sourceName: story.source,
    sourceUrl: story.url,
    publishedAt: story.sourceDate,
    category,
    region: regionFor(story),
    sourceGrade,
    isPrimarySource,
    evidenceCompleteness,
    trendClusterId: recordId,
    whyItMatters: story.interpretation,
    potentialAngles: potentialAnglesFor(category),
    watchpoints: story.watchpoints,
    stakeholders: story.stakeholders,
    novelty,
    materiality,
    durability,
    priority,
    status: "ready",
    tags: tagsFor(story, category),
    evidence: [
      {
        id: "S1",
        sourceName: story.source,
        sourceUrl: story.url,
        publishedAt: story.sourceDate,
        sourceGrade,
        locator: `${story.originalTitle} · ${story.sourceDate}`,
        claim: story.fact,
        status: isPrimarySource ? "verified" : "revise",
      },
    ],
    provenance: {
      producer: "employee-1-content-scout",
      pipeline: "weekly",
      recordId,
      issueKey,
    },
  };
}

function main(): void {
  const issueKey = readArg("issue") || "2026-w43";
  const weeklyPath = resolve(process.cwd(), "data", "wechat", "weekly", `${issueKey}.json`);
  if (!existsSync(weeklyPath)) {
    throw new Error(`未找到周报：${weeklyPath}`);
  }
  const issue = JSON.parse(readFileSync(weeklyPath, "utf8")) as WeeklyIssue;
  const detectedAt = readArg("detected-at") || new Date().toISOString();
  const signals = issue.stories.map((story) => buildSignal(issue, issueKey, story, detectedAt));
  const dryRun = hasFlag("dry-run");
  const result = appendContentSignals(signals, { detectedAt, dryRun });

  console.log(JSON.stringify({
    issueKey,
    signals: signals.length,
    ...result,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
