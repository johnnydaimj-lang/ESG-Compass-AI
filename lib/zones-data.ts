// ESG Compass — 专区类型与数据
// 纯数据层，不依赖 node:fs，可在客户端组件使用

export interface Zone {
  id: string;
  name: string;
  description: string;
  eventIds: string[];
  milestones: { date: string; title: string; summary: string }[];
}

const zoneData: Zone[] = [
  {
    id: "esg-disclosure",
    name: "ESG 信息披露",
    description: "全球 ESG 信息披露框架的演进与最新动态，涵盖 ISSB、CSRD、SASB 等强制与自愿披露标准。",
    eventIds: ["m-sg-issb", "m-exp-omnibus", "m-exp-issb"],
    milestones: [
      { date: "2021-11-03", title: "IFRS 宣布成立 ISSB", summary: "IFRS 基金会于 COP26 期间宣布成立 ISSB，整合 SASB、CDSB 等既有框架，目标制定全球统一的可持续披露基准。" },
      { date: "2023-06-26", title: "ISSB 正式发布 IFRS S1、S2 准则", summary: "ISSB 发布首批两项准则，标志着全球可持续披露进入新阶段。" },
      { date: "2024-01-01", title: "欧盟 CSRD 正式生效", summary: "CSRD 取代 NFRD，将适用企业范围大幅扩大，要求按 ESRS 进行双重重要性评估。" },
      { date: "2025-01-01", title: "CSRD 首批适用企业开始报告", summary: "大型企业为首批须按 CSRD 要求披露 2024 财年可持续信息的主体。" },
      { date: "2026-07-18", title: "新加坡推进 ISSB 披露路线图", summary: "新加坡金管局明确上市公司分阶段对标 ISSB 准则的时间表。" },
    ],
  },
  {
    id: "esg-rating",
    name: "ESG 评级",
    description: "全球主要 ESG 评级机构的模型变化、监管动态与方法论演进。",
    eventIds: ["m-rat-msci", "m-rat-ecovadis", "m-aca-rating"],
    milestones: [
      { date: "2021-10-01", title: "IOSCO 启动 ESG 评级市场审查", summary: "国际证监会组织开始对全球 ESG 评级机构进行市场审查。" },
      { date: "2023-07-01", title: "欧盟 ESG 评级活动监管提案", summary: "欧盟委员会提出 ESG 评级活动监管草案，要求评级机构披露方法、分离咨询与评级业务。" },
      { date: "2024-03-01", title: "ESMA 发布 ESG 评级指南", summary: "ESMA 要求评级机构清晰区分 E、S、G 各维度的评分逻辑。" },
      { date: "2026-07-17", title: "MSCI 年度模型调整", summary: "MSCI 上调气候脆弱性在关键议题中的权重，转型计划披露质量开始影响治理维度得分。" },
    ],
  },
  {
    id: "sustainable-supply-chain",
    name: "可持续供应链",
    description: "全球供应链可持续法规与机制的最新进展。",
    eventIds: ["m-eu-csddd", "m-eu-cbam", "m-exp-cbam-sme", "m-aca-supply"],
    milestones: [
      { date: "2022-02-23", title: "欧盟 CSDDD 提案发布", summary: "欧盟委员会发布 CSDDD 提案，要求大型企业对其价值链上下游进行尽职调查。" },
      { date: "2024-05-24", title: "CSDDD 正式通过", summary: "欧盟理事会正式通过 CSDDD，分阶段 2027 年起适用。" },
      { date: "2025-10-01", title: "CBAM 过渡期最后一年", summary: "CBAM 过渡期进入最后阶段，为 2026 年正式收费做准备。" },
      { date: "2026-07-21", title: "CBAM 进入正式收费期", summary: "进口商须按季度申报隐含碳排放并购买 CBAM 证书。" },
      { date: "2026-07-24", title: "CSDDD 首轮合规检查启动", summary: "欧盟成员国监管机构开始开展首轮合规检查。" },
    ],
  },
];

export function getAllZones(): Zone[] { return zoneData; }
export function getZoneById(id: string): Zone | undefined { return zoneData.find((z) => z.id === id); }
export function getZonesByEventId(eventId: string): Zone[] { return zoneData.filter((z) => z.eventIds.includes(eventId)); }
