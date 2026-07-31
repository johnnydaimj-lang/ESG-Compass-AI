// ESG Compass — 专区类型与数据
// 纯数据层，不依赖 node:fs，可在客户端组件使用

export interface Zone {
  id: string;
  name: string;
  description: string;
  eventIds: string[];
  milestones: { date: string; title: string; summary: string }[];
  keywords?: string[];
}

export const DEFAULT_ZONES: Zone[] = [
  {
    id: "esg-disclosure",
    name: "ESG 信息披露",
    description: "全球 ESG 信息披露框架的演进与最新动态，涵盖 ISSB、CSRD、SASB 等强制与自愿披露标准。",
    eventIds: ["m-sg-issb", "m-exp-omnibus", "m-exp-issb"],
    milestones: [
      { date: "2021-11-03", title: "IFRS 宣布成立 ISSB", summary: "IFRS 基金会于 COP26 期间宣布成立 ISSB，整合 SASB、CDSB 等既有框架，目标是制定全球统一的可持续披露基准。" },
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
      { date: "2021-10-01", title: "IOSCO 启动 ESG 评级市场审查", summary: "国际证监组织开始对全球 ESG 评级机构进行市场审查。" },
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
  // === 新增 5 区 ===
  {
    id: "labor-human-rights",
    name: "劳工与人权",
    description: "全球供应链中的劳工权益与人权保护法规演进，涵盖强迫劳动禁令、国际劳工标准、跨国企业的尽职调查义务及各国监管差异。",
    eventIds: ["m-aca-supply", "m-eu-forced-labor", "m-exp-labor-supply"],
    milestones: [
      { date: "2022-09-14", title: "美国 UFLPA《维吾尔强迫劳动预防法》全面生效", summary: "美国海关推定所有与新疆相关的产品为强迫劳动产品，除非进口商提供清晰且令人信服的反证。" },
      { date: "2024-03-13", title: "欧盟《禁止强迫劳动产品条例》立法提案", summary: "欧盟委员会提出禁止强迫劳动产品进入欧盟市场的条例提案，要求企业建立供应链追溯体系。" },
      { date: "2025-06-01", title: "ILO 通过第 191 号建议书", summary: "国际劳工组织通过关于供应链中劳工权利尽职调查的新建议书，为各国立法提供指引。" },
      { date: "2026-07-28", title: "欧盟强迫劳动条例进入执法准备阶段", summary: "欧盟成员国海关与市场监管机构开始搭建执法框架，企业须建立全供应链追溯体系。" },
    ],
  },
  {
    id: "green-finance",
    name: "绿色金融",
    description: "可持续金融法规、绿色债券标准、转型金融分类目录及气候融资工具的发展动态。",
    eventIds: ["m-sg-issb", "m-eu-gbs"],
    milestones: [
      { date: "2020-06-22", title: "欧盟可持续金融分类目录正式生效", summary: "EU Taxonomy 正式生效，为判断经济活动是否环境可持续提供分类标准。" },
      { date: "2021-07-06", title: "欧盟可持续金融披露条例（SFDR）生效", summary: "要求金融市场参与者披露其金融产品的可持续性风险整合方式和不利影响。" },
      { date: "2023-11-28", title: "欧盟绿色债券标准（EUGBS）立法通过", summary: "EUGBS 为绿色债券发行提供自愿性标准，要求与 EU Taxonomy 对齐并接受外部认证。" },
      { date: "2025-03-01", title: "转型金融概念在多国分类目录中落地", summary: "多个国家在分类目录中引入转型活动类别，为高碳行业向净零过渡提供融资框架。" },
      { date: "2026-07-26", title: "EUGBS 进入强制认证阶段", summary: "在欧盟发行绿色债券须通过强制认证并与分类目录对齐，外部审查机构须在 ESMA 注册。" },
    ],
  },
  {
    id: "climate-risk",
    name: "气候风险",
    description: "气候相关财务风险的识别、评估与披露方法论，涵盖情景分析、碳定价、物理风险评估与转型路径规划。",
    eventIds: ["m-sg-issb", "m-rat-msci", "m-exp-issb", "m-eu-cbam", "m-exp-climate-scenario"],
    milestones: [
      { date: "2017-06-29", title: "TCFD 发布首次披露建议", summary: "TCFD 发布气候相关财务信息披露建议，奠定治理、战略、风险管理、指标与目标四支柱框架。" },
      { date: "2021-11-03", title: "COP26 推动由气候承诺转向实施", summary: "格拉斯哥气候公约要求各国在 2022 年底前强化 NDC，加速气候风险的监管整合。" },
      { date: "2023-06-26", title: "ISSB S2 正式整合 TCFD 框架", summary: "IFRS S2 实质采纳 TCFD 框架逻辑，气候风险披露从自愿走向半强制。" },
      { date: "2025-06-01", title: "NGFS 发布第四版情景数据库", summary: "NGFS 更新气候情景数据，纳入更细化的物理风险和转型风险路径。" },
      { date: "2026-07-21", title: "欧盟 CBAM 碳定价机制正式收费", summary: "CBAM 证书价格与 EU ETS 挂钩，碳成本成为出口企业必须量化的经营变量。" },
    ],
  },
  {
    id: "biodiversity",
    name: "生物多样性",
    description: "自然资本评估与生物多样性保护的国际框架与政策动态，涵盖 TNFD、昆明-蒙特利尔全球生物多样性框架及相关披露要求。",
    eventIds: ["m-gbf-tnfd"],
    milestones: [
      { date: "2022-12-19", title: "COP15 通过昆明-蒙特利尔全球生物多样性框架", summary: "协议设定到 2030 年保护 30% 陆地和海洋、减少每年 5000 亿美元有害补贴等目标。" },
      { date: "2023-09-18", title: "TNFD 正式发布 v1.0 框架", summary: "TNFD 发布基于定位-评估-评估-准备（LEAP）方法的自然相关风险管理与披露框架。" },
      { date: "2024-06-01", title: "自然资本核算进入标准制定阶段", summary: "多个标准制定机构启动自然资本核算的会计与审计方法学开发。" },
      { date: "2025-05-01", title: "英国率先表态将 TNFD 纳入国内标准", summary: "英国成为首个明确将 TNFD 框架纳入国内可持续披露标准的国家。" },
      { date: "2026-07-25", title: "TNFD 框架获多国监管采纳", summary: "英国、日本、瑞士等国将在国内披露标准中引入 TNFD 的 LEAP 方法，自然风险评估走向半强制。" },
    ],
  },
  {
    id: "esg-events",
    name: "ESG 活动",
    description: "全球范围内重要的 ESG 相关会议、论坛、峰会与学术交流活动动态与成果回顾。",
    eventIds: ["m-event-nyc-climate-week"],
    milestones: [
      { date: "2025-09-22", title: "2025 纽约气候周召开", summary: "主题聚焦碳市场第六条的规则制定与自然融资机制设计，加速公私资本配置。" },
      { date: "2025-11-10", title: "COP30 筹备工作启动", summary: "巴西亚马逊城市贝伦为 COP30 主办地，聚焦全球适应目标盘点与资金落实。" },
      { date: "2026-05-15", title: "全球可持续投资论坛（GSIF）召开", summary: "ISSB 与各交易所集团讨论全球可持续披露趋同与投资者数据需求。" },
      { date: "2026-07-20", title: "2026 纽约气候周召开", summary: "碳市场互联与自然融资成为核心议题，生物多样性信用试点方案获得关注。" },
    ],
  },
];

export const DEFAULT_ZONE_KEYWORDS: Record<string, string[]> = {
  "esg-disclosure": ["issb", "sasb", "csrd", "esrs", "披露", "disclosure", "taxonomy", "ifrs", "sustainability reporting"],
  "esg-rating": ["rating", "esg rating", "评级", "msci", "ecovadis", "sustainalytics"],
  "sustainable-supply-chain": ["supply chain", "供应链", "csddd", "cbam", "due diligence", "尽职调查", "forced labour", "forced labor", "强迫劳动"],
  "labor-human-rights": ["labor", "labour", "劳工", "human rights", "人权", "forced labour", "forced labor", "强迫劳动", "workers", "工人"],
  "green-finance": ["green finance", "绿色金融", "bond", "债券", "blended finance", "transition finance", "转型金融", "sustainable finance", "green investments"],
  "climate-risk": ["climate", "气候", "carbon", "碳", "cbam", "net zero", "净零", "scenario", "情景"],
  "biodiversity": ["biodiversity", "生物多样", "tnfd", "deforestation", "nature", "natural capital", "森林"],
  "esg-events": ["climate week", "论坛", "峰会", "seminar", "conference", "event", "活动", "cop30", "cop29", "gsif"],
};

export function getZoneKeywords(zoneId: string): string[] {
  const zone = DEFAULT_ZONES.find((z) => z.id === zoneId);
  return zone?.keywords || DEFAULT_ZONE_KEYWORDS[zoneId] || [];
}

export function getZonesForContent(content: { title?: string; summary?: string; esgTopic?: string }): Zone[] {
  const text = `${content.title || ""} ${content.summary || ""} ${content.esgTopic || ""}`.toLowerCase();
  return DEFAULT_ZONES.filter((z) => (z.keywords || DEFAULT_ZONE_KEYWORDS[z.id] || []).some((k) => text.includes(k.toLowerCase())));
}

export function getAllZones(): Zone[] { return DEFAULT_ZONES; }
export function getZoneById(id: string): Zone | undefined { return DEFAULT_ZONES.find((z) => z.id === id); }
export function getZonesByEventId(eventId: string): Zone[] { return DEFAULT_ZONES.filter((z) => z.eventIds.includes(eventId)); }
