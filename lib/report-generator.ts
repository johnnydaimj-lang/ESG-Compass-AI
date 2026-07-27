// 简报生成逻辑：三种模式的内容组装 + docx 文档构建

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { EventItem } from "./esg-data";
import { computeSubscriptionDigest } from "./analytics";
import { isClientPressure, sortByPriority } from "./priority-rules";

export type BriefMode = "daily" | "weekly" | "regional";

export const BRIEF_MODE_LABELS: Record<BriefMode, string> = {
  daily: "每日简报",
  weekly: "每周简报",
  regional: "区域专题",
};

export interface BriefSection {
  heading: string;
  paragraphs: string[];
  table?: { headers: string[]; rows: string[][] };
}

export interface BriefContent {
  mode: BriefMode;
  title: string;
  generatedAt: string;
  scope: string;
  sections: BriefSection[];
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function eventLine(e: EventItem): string {
  return `【${e.importanceLevel}】${e.title}（${e.region}，${e.publishedAt}）——${e.summary}`;
}

export function buildDailyBrief(events: EventItem[]): BriefContent {
  const sorted = sortByPriority(events);
  const high = sorted.filter((e) => e.importanceLevel === "高");
  const client = sorted.filter(isClientPressure);
  const risk = sorted.filter((e) => e.riskTags.length > 0);

  return {
    mode: "daily",
    title: `ESG 每日简报（${todayString()}）`,
    generatedAt: new Date().toISOString(),
    scope: "全部地区 / 全部类型",
    sections: [
      {
        heading: "一、当日高优先级事件",
        paragraphs: high.length > 0 ? high.map(eventLine) : ["当日无高优先级事件。"],
      },
      {
        heading: "二、客户压力",
        paragraphs: client.length > 0 ? client.map(eventLine) : ["当日无新增客户/链主要求。"],
      },
      {
        heading: "三、主要风险",
        paragraphs:
          risk.length > 0
            ? risk.map((e) => `【${e.importanceLevel}】${e.title}——风险标签：${e.riskTags.join("、")}。${e.businessImpact}`)
            : ["当日无带风险标签的事件。"],
      },
    ],
  };
}

export function buildWeeklyBrief(events: EventItem[]): BriefContent {
  const digest = computeSubscriptionDigest(events);
  const sorted = sortByPriority(events);
  const topEvents = sorted.slice(0, 5);

  return {
    mode: "weekly",
    title: `ESG 每周简报（截至 ${todayString()}）`,
    generatedAt: new Date().toISOString(),
    scope: "全部地区 / 全部类型",
    sections: [
      {
        heading: "一、月度趋势表",
        paragraphs: [],
        table: {
          headers: ["事件类型", "事件数量", "占比"],
          rows: digest.byType.map((row) => [
            row.type,
            String(row.count),
            `${Math.round((row.count / Math.max(1, events.length)) * 100)}%`,
          ]),
        },
      },
      {
        heading: "二、风险迁移",
        paragraphs: [
          `本周新增带风险标签事件 ${events.filter((e) => e.riskTags.length > 0).length} 条，主要风险标签集中于：${
            [...new Set(events.flatMap((e) => e.riskTags))].join("、") || "无"
          }。`,
          "风险重心由单一披露合规向供应链尽职调查与客户审核双轨压力迁移，建议将客户审核准备与监管合规整改合并排期。",
        ],
      },
      {
        heading: "三、区域比较",
        paragraphs: digest.byRegion.map(
          (row) => `${row.region}：${row.count} 条事件${row.region === "欧盟" ? "，以监管执行为主" : row.region === "新加坡" ? "，以披露基础设施建设为主" : "，覆盖全球业务"}。`,
        ),
      },
      {
        heading: "四、重点事件",
        paragraphs: topEvents.map(eventLine),
      },
    ],
  };
}

export function availableRegions(events: EventItem[]): string[] {
  return [...new Set(events.map((e) => e.region))];
}

export function buildRegionalBrief(events: EventItem[], region: string): BriefContent {
  const scoped = sortByPriority(events.filter((e) => e.region === region));
  const others = sortByPriority(events.filter((e) => e.region !== region && e.region !== "全球"));

  return {
    mode: "regional",
    title: `ESG 区域专题：${region}（截至 ${todayString()}）`,
    generatedAt: new Date().toISOString(),
    scope: `地区：${region}`,
    sections: [
      {
        heading: `一、${region}地区事件全景`,
        paragraphs: scoped.length > 0 ? scoped.map(eventLine) : [`${region}地区暂无收录事件。`],
      },
      {
        heading: "二、对本地区企业的业务影响",
        paragraphs:
          scoped.length > 0
            ? scoped.map((e) => `${e.title}：${e.businessImpact}`)
            : ["暂无需要说明的业务影响。"],
      },
      {
        heading: "三、建议动作",
        paragraphs:
          scoped.length > 0
            ? scoped.flatMap((e) => e.actions.map((a) => `[${e.title}] ${a}`))
            : ["暂无建议动作。"],
      },
      {
        heading: "四、其他地区动态对照",
        paragraphs:
          others.length > 0 ? others.map((e) => `${e.region}：${e.title}（${e.importanceLevel}）`) : ["其他地区暂无新增动态。"],
      },
    ],
  };
}

export function buildBrief(mode: BriefMode, events: EventItem[], region?: string): BriefContent {
  if (mode === "weekly") return buildWeeklyBrief(events);
  if (mode === "regional") return buildRegionalBrief(events, region ?? availableRegions(events)[0] ?? "全球");
  return buildDailyBrief(events);
}

function sectionToParagraphs(section: BriefSection): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 160 },
      children: [new TextRun({ text: section.heading, bold: true, size: 28 })],
    }),
  ];
  for (const para of section.paragraphs) {
    blocks.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: para, size: 22 })],
      }),
    );
  }
  if (section.table) {
    const headerRow = new TableRow({
      children: section.table.headers.map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
          }),
      ),
    });
    const bodyRows = section.table.rows.map(
      (row) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
              }),
          ),
        }),
    );
    blocks.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...bodyRows],
      }),
    );
  }
  return blocks;
}

export async function buildBriefDocx(brief: BriefContent): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: brief.title, bold: true, size: 36 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: `范围：${brief.scope} ｜ 生成时间：${brief.generatedAt.slice(0, 16).replace("T", " ")}`,
                size: 18,
                color: "666666",
              }),
            ],
          }),
          ...brief.sections.flatMap(sectionToParagraphs),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
