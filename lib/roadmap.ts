// ESG Compass — 功能路线图数据（v2）
// 与 docs/PRD.md 同步维护；只记录当前运行版本的能力与后续计划。
// 已删除的个人工作台、独立知识库、AI 问答与 Agent/Harness 不再列入。

export type RoadmapCategory = "已完成" | "进行中" | "待开始" | "已归栈";
export type RoadmapPriority = "P0" | "P1" | "P2" | "P3";

export interface RoadmapItem {
  id: string;
  label: string;
  description: string;
  category: RoadmapCategory;
  priority: RoadmapPriority;
}

export const ROADMAP: RoadmapItem[] = [
  {
    id: "prd-rewrite",
    label: "需求与架构基线重建",
    description: "从当前运行版本提取新产品需求说明（docs/PRD.md）与架构说明（docs/ARCHITECTURE.md），作为 v2 唯一需求事实源。",
    category: "已完成",
    priority: "P0"
  },
  {
    id: "publication-snapshot",
    label: "发布快照存储层",
    description: "所有公开出口统一读取 data/publication（contents/stories/hotspots/status/version），不再回退旧 data/contents.json。",
    category: "已完成",
    priority: "P0"
  },
  {
    id: "prompt-runtime",
    label: "Prompt 运行时与治理",
    description: "prompts/*.md 支持 {{name}} 变量与 {{> partial}} 递归 include，缺失与循环显式报错，版本哈希纳入全部 include。",
    category: "已完成",
    priority: "P0"
  },
  {
    id: "dual-scoring",
    label: "双评分与入选门槛",
    description: "两次独立五轴评分，均达理解底线且总分达两倍信源门槛才入选；精选分向下取整，SIGNAL 永不入选。",
    category: "已完成",
    priority: "P0"
  },
  {
    id: "identity-split",
    label: "材料 ID 与信源 ID 分离",
    description: "memberIds 保存材料 ID，participants 与热度证据保存真实信源 ID，未匹配信源记录为 unmatched-<hash> 并告警。",
    category: "已完成",
    priority: "P1"
  },
  {
    id: "clustering",
    label: "故事聚簇机制",
    description: "近重复阈值 0.92、同故事阈值 0.60、14 天召回窗口；聚簇后输出 StoryCluster。",
    category: "已完成",
    priority: "P1"
  },
  {
    id: "heat-model",
    label: "热度模型重写",
    description: "48 小时窗口、24 小时半衰期、独立信源去重，至少 2 个参与方且含 1 个编辑信源才进入热点。",
    category: "已完成",
    priority: "P1"
  },
  {
    id: "pipeline-modes",
    label: "快照 / 实时管道模式",
    description: "scripts/pipeline/run.ts 提供 snapshot / live / llm 三种模式；实时模式只为已实现的 RSS 适配器联网，其余信源记录跳过。",
    category: "已完成",
    priority: "P0"
  },
  {
    id: "source-runs",
    label: "信源运行状态",
    description: "每次运行写入完整 SourceRunStatus 列表（含 skipped 与告警），同步 promptVersions 供审计。",
    category: "已完成",
    priority: "P1"
  },
  {
    id: "ops-rewire",
    label: "运营后台对接发布快照",
    description: "看板、内容审阅、热点故事页统一读取 readPipelineStatus / readPublishedContents / readHotspots。",
    category: "已完成",
    priority: "P1"
  },
  {
    id: "product-map",
    label: "产品说明与路线图更新",
    description: "lib/product-map.ts 与 lib/roadmap.ts 重写为 v2，仅描述当前运行版本，删除已归栈功能。",
    category: "已完成",
    priority: "P2"
  },
  {
    id: "rss-expansion",
    label: "更多信源适配器",
    description: "为当前仅支持 RSS 的信源补齐网页、邮件与 API 适配器，减少实时模式下的 skipped 信源。",
    category: "进行中",
    priority: "P1"
  },
  {
    id: "test-coverage",
    label: "管道单元测试",
    description: "为 prompt 运行时、双评分、聚簇、热度与发布快照补齐 node:test 单元测试。",
    category: "进行中",
    priority: "P1"
  },
  {
    id: "llm-mode-hardening",
    label: "llm 模式稳定性",
    description: "为 llm 管道模式补充模型调用重试、超时与降级策略，并在运行状态中记录失败原因。",
    category: "待开始",
    priority: "P2"
  },
  {
    id: "snapshot-diff",
    label: "快照差异对比",
    description: "运营后台展示相邻两次发布快照的新增、变更与移除内容，辅助人工复核。",
    category: "待开始",
    priority: "P2"
  },
  {
    id: "legacy-features",
    label: "已删除功能归档",
    description: "个人工作台、独立知识库、AI 问答与 Agent/Harness 已从当前产品移除，仅保留历史记录，不进入 v2 需求。",
    category: "已归栈",
    priority: "P3"
  }
];
