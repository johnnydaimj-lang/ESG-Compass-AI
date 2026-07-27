// ESG 简报 — 事件数据与类型定义（当前阶段使用 mock 数据，后续迁移至 Prisma + libSQL）

export const EVENT_TYPES = [
  "政策法规",
  "客户/链主要求",
  "行业风险事件",
  "奖项申报",
  "评级动态",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type ImportanceLevel = "高" | "中" | "低";

export type ReviewStatus = "pending" | "reviewed";

export const REVIEW_ACTIONS = ["ignore", "observe", "follow_up", "escalate"] as const;

export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export interface EventItem {
  id: string;
  title: string;
  eventType: EventType;
  region: string;
  publishedAt: string; // YYYY-MM-DD
  importanceLevel: ImportanceLevel;
  summary: string;
  businessImpact: string;
  whyImportant: string;
  suggestedOwners: string[];
  riskTags: string[];
  topicTags: string[];
  sourceName: string;
  sourceUrl: string;
  actions: string[];
  reviewStatus: ReviewStatus;
  reviewAction: ReviewAction | null;
  reviewNote: string;
}

export const REVIEW_ACTION_LABELS: Record<ReviewAction, string> = {
  ignore: "忽略",
  observe: "观察",
  follow_up: "跟进",
  escalate: "升级",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "待校对",
  reviewed: "已校对",
};

const mockEvents: EventItem[] = [
  {
    id: "evt-eu-csddd-enforcement",
    title: "欧盟供应链尽职调查要求进入更强执行阶段",
    eventType: "政策法规",
    region: "欧盟",
    publishedAt: "2026-07-24",
    importanceLevel: "高",
    summary:
      "欧盟成员国监管机构开始依据《企业可持续发展尽职调查指令》(CSDDD) 的转化立法开展首轮合规检查，重点覆盖在欧营业额达标的大型企业及其一级供应商，要求提供成文的尽职调查政策、风险图谱与整改计划。",
    businessImpact:
      "对欧出口或设有欧盟实体的企业需在接受客户审核之外，直接面对监管层的尽职调查文件抽查；缺失风险图谱与申诉机制记录可能导致整改令或营收挂钩的罚款，影响对欧业务连续性。",
    whyImportant:
      "指令从披露义务升级为可被执法的行为义务，检查节奏明显加快；多家成员国监管机构已公布抽查名单与问卷模板，属于确定性高的合规压力。",
    suggestedOwners: ["法务合规", "采购/供应链", "ESG 办公室"],
    riskTags: ["合规处罚", "供应链中断", "审核加严"],
    topicTags: ["尽职调查", "人权", "欧盟监管"],
    sourceName: "欧盟委员会司法与消费者总司",
    sourceUrl:
      "https://commission.europa.eu/business-economy-euro/doing-business-eu/sustainability-due-diligence-responsible-business/corporate-sustainability-due-diligence_en",
    actions: [
      "两周内完成供应链人权与环境风险图谱的自查盘点",
      "核对成员国转化立法的适用门槛与时间表，确认本企业是否在首批适用范围",
      "建立申诉机制与整改计划文档模板，供监管抽查与客户审核复用",
    ],
    reviewStatus: "pending",
    reviewAction: null,
    reviewNote: "",
  },
  {
    id: "evt-apple-supplier-esg-questionnaire",
    title: "Apple 更新供应商 ESG 问卷与审核口径",
    eventType: "客户/链主要求",
    region: "全球",
    publishedAt: "2026-07-22",
    importanceLevel: "高",
    summary:
      "Apple 向供应商发布新版年度 ESG 问卷，温室气体范围三数据、再生材料占比与劳工工时合规的证明材料要求明显细化，现场审核抽样比例提高，未达标项将进入限期整改名单。",
    businessImpact:
      "直接供应商面临更细颗粒度的数据填报与举证压力，问卷得分与订单分配挂钩；范围三数据缺口可能在下一轮审核中形成不符合项，影响现有订单与新品导入资格。",
    whyImportant:
      "链主问卷口径变化通常在一个审核周期内传导为硬性不符合项；提前一个季度补齐数据缺口，是避免订单分配受影响的最低成本窗口。",
    suggestedOwners: ["销售/客户管理", "ESG 办公室", "生产运营"],
    riskTags: ["客户流失", "审核加严", "数据缺口"],
    topicTags: ["客户审核", "碳数据", "劳工权益"],
    sourceName: "Apple 供应商责任",
    sourceUrl: "https://www.apple.com/supplier-responsibility/",
    actions: [
      "对照新版问卷逐项核对现有数据与证明材料，标注缺口项",
      "优先补齐范围三排放与工时记录两类高频不符合项",
      "与客户管理团队同步整改排期，必要时申请预审沟通",
    ],
    reviewStatus: "pending",
    reviewAction: null,
    reviewNote: "",
  },
  {
    id: "evt-sg-sustainable-finance-infra",
    title: "新加坡可持续披露与绿色金融基础设施持续推进",
    eventType: "政策法规",
    region: "新加坡",
    publishedAt: "2026-07-18",
    importanceLevel: "中",
    summary:
      "新加坡金融管理局与会计与企业管理局推进可持续披露路线图，上市公司及大型非上市公司将分阶段对标 ISSB 准则披露气候信息，同时绿色金融分类目录与转型信贷指引进一步完善。",
    businessImpact:
      "在新加坡上市、发债或设有区域总部的企业需提前布局气候数据与鉴证能力；披露口径与 ISSB 对齐后，现有 ESG 报告指标口径可能需要重述，影响融资材料的一致性。",
    whyImportant:
      "披露路线图明确了分阶段时间表，属于中期确定性义务；提前一年准备数据与鉴证能力可显著降低合规成本。",
    suggestedOwners: ["财务/投资者关系", "ESG 办公室"],
    riskTags: ["披露合规"],
    topicTags: ["气候披露", "ISSB", "绿色金融"],
    sourceName: "新加坡金融管理局 (MAS)",
    sourceUrl: "https://www.mas.gov.sg/development/sustainable-finance",
    actions: [
      "梳理集团内适用新加坡披露路线图的法律实体清单",
      "对照 ISSB 准则评估现有气候指标的数据质量与鉴证准备度",
    ],
    reviewStatus: "pending",
    reviewAction: null,
    reviewNote: "",
  },
  {
    id: "evt-ecovadis-awards-2026",
    title: "EcoVadis 可持续供应链卓越奖开放申报",
    eventType: "奖项申报",
    region: "全球",
    publishedAt: "2026-07-15",
    importanceLevel: "低",
    summary:
      "EcoVadis 年度可持续供应链卓越奖开放申报，面向在 EcoVadis 评级中表现领先的采购方与供应商，申报窗口约两个月，评审侧重供应链可持续项目的可复制性与量化成效。",
    businessImpact:
      "获奖可用于客户投标与品牌传播的第三方背书；申报本身需要投入数据整理与案例撰写成本，对短期经营无直接影响。",
    whyImportant:
      "属于加分项而非合规要求，适合在 EcoVadis 评级成绩较好的业务线择优申报，提升对下游客户的可见度。",
    suggestedOwners: ["市场/品牌", "ESG 办公室"],
    riskTags: [],
    topicTags: ["奖项申报", "品牌背书"],
    sourceName: "EcoVadis",
    sourceUrl: "https://ecovadis.com/",
    actions: [
      "确认最新一期 EcoVadis 评级分数是否达到申报竞争力区间",
      "评估申报窗口与内部数据准备的工作量，决定是否参与",
    ],
    reviewStatus: "pending",
    reviewAction: null,
    reviewNote: "",
  },
  {
    id: "evt-ecovadis-methodology-update",
    title: "EcoVadis 供应商评级方法说明更新",
    eventType: "评级动态",
    region: "全球",
    publishedAt: "2026-07-10",
    importanceLevel: "低",
    summary:
      "EcoVadis 更新评级方法说明文件，细化环境维度中范围三排放证据的计分口径，并调整了中小企业问卷的行业权重表，新一轮评级将按新口径执行。",
    businessImpact:
      "正在准备或即将接受 EcoVadis 复评的供应商需要按新口径重估自评得分；范围三证据不足的企业评级可能下滑，进而影响要求最低评级的客户准入。",
    whyImportant:
      "评级口径变化直接影响分数可预期性，提前校准自评能避免复评时的分数意外下滑。",
    suggestedOwners: ["ESG 办公室"],
    riskTags: ["评级下滑"],
    topicTags: ["EcoVadis", "评级方法"],
    sourceName: "EcoVadis",
    sourceUrl: "https://support.ecovadis.com/",
    actions: [
      "下载新版方法说明，比对环境维度计分口径变化",
      "按新口径重跑一次内部自评，识别可能掉分的证据缺口",
    ],
    reviewStatus: "pending",
    reviewAction: null,
    reviewNote: "",
  },
];

export function getAllEvents(): EventItem[] {
  return mockEvents;
}

export function getEventById(id: string): EventItem | undefined {
  return mockEvents.find((e) => e.id === id);
}
