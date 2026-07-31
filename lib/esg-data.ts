// ESG Compass — 内容数据与类型定义
// 优先从 data/contents.json 读取，无文件时降级到硬编码 mock 数据

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export const CONTENT_TYPES = ["ESG 政策", "专家观点", "学术文章", "评级动态"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type ImportanceLevel = "高" | "中" | "低";

export const SASB_TOPICS = [
  "温室气体排放", "气候风险", "供应链管理", "水资源管理",
  "人权与劳工", "合规与监管", "数据安全", "社区关系",
  "废弃物管理", "产品质量与安全",
] as const;
export type SasbTopic = (typeof SASB_TOPICS)[number];


// === Impact Analysis (Policy Impact Card) ===

// Base fields shared across all lens types
interface ImpactBase {
  relevance: "高" | "中" | "低";
  whyThisMatters: string;
}

// ESG 政策镜片
export interface PolicyImpact extends ImpactBase {
  contentType: "ESG 政策";
  impactLevel: "高" | "中" | "低";
  impactScore: number;
  scoreBreakdown: { scope: number; magnitude: number; enforceability: number };
  affectedIndustries: string[];
  timeline: "已生效" | "即将生效" | "待观察";
  effectiveDate?: string;
  actionsRequired: string[];
  keyClauses: string[];
}

// 学术文章镜片
export interface AcademicImpact extends ImpactBase {
  contentType: "学术文章";
  researchFinding: string;
  methodologyQuality: "高" | "中" | "低";
  practicalImplication: string;
  sourceCredibility: "高" | "中" | "低";
}

// 专家观点镜片
export interface ExpertImpact extends ImpactBase {
  contentType: "专家观点";
  sourceCredibility: "高" | "中" | "低";
  keyArgument: string;
  position: "主流共识" | "争议观点" | "前瞻判断";
}

// 评级动态镜片（简化）
export interface RatingImpact extends ImpactBase {
  contentType: "评级动态";
  impactLevel: "高" | "中" | "低";
  affectedSectors: string[];
  actionsRequired: string[];
}

export type ImpactAnalysis = PolicyImpact | AcademicImpact | ExpertImpact | RatingImpact;

export interface ContentItem {
  impactAnalysis?: ImpactAnalysis;
  id: string;
  title: string;
  contentType: ContentType;
  region: string;
  publishedAt: string;
  importanceLevel: ImportanceLevel;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  esgTopic: string;
  aiDraft?: boolean;
  recommended?: boolean;
  whyMatters?: string;
  articleUrl?: string;
  riskPrompts?: string[];
}

const DATA_FILE = resolve(process.cwd(), "data", "contents.json");

function loadFromFile(): ContentItem[] | null {
  try {
    if (!existsSync(DATA_FILE)) return null;
    const raw = readFileSync(DATA_FILE, "utf-8");
    const items = JSON.parse(raw);
    if (Array.isArray(items) && items.length > 0) return items;
    return null;
  } catch {
    console.warn("[esg-data] 读取 data/contents.json 失败，降级到 mock");
    return null;
  }
}

const mockContents: ContentItem[] = [
  { id: "m-eu-csddd", title: "欧盟供应链尽职调查要求进入更强执行阶段", contentType: "ESG 政策", region: "欧盟", publishedAt: "2026-07-24", importanceLevel: "高", summary: "欧盟成员国监管机构开始依据 CSDDD 的转化立法开展首轮合规检查，重点覆盖在欧营业额达标的大型企业及其一级供应商，要求提供成文的尽职调查政策、风险图谱与整改计划。", sourceName: "欧盟委员会", sourceUrl: "https://commission.europa.eu/", esgTopic: "合规与监管", recommended: true,
    whyMatters: "信号：高 | 影响：合规、供应链. CSDDD首轮检查已启动，覆盖达标企业及其一级供应商。建议尽早核查供应商尽职调查政策的完备性。",
    articleUrl: "https://www.google.com/search?q=site%3Acommission.europa.eu%20CSDDD%20%E4%BE%9B%E5%BA%94%E9%93%BE%E5%B0%BD%E8%81%8C%E8%B0%83%E6%9F%A5%20%E9%A6%96%E8%BD%AE%E6%A3%80%E6%9F%A5" },
  { id: "m-event-nyc-climate-week", title: "2026 纽约气候周：碳市场互联与自然融资成焦点议题", contentType: "专家观点", region: "全球", publishedAt: "2026-07-20", importanceLevel: "中", summary: "2026年纽约气候周核心讨论集中在国际碳市场第六条的实施细则、碳信用质量标准的统一，以及自然融资（自然资本核算、生物多样性信用）的试点进展。", sourceName: "Climate Week NYC", sourceUrl: "https://www.climateweeknyc.org/", esgTopic: "气候风险",
    articleUrl: "https://www.google.com/search?q=site%3Aclimateweeknyc.org%20%E7%BA%BD%E7%BA%A6%E6%B0%94%E5%80%99%E5%91%A8%20%E7%A2%B3%E5%B8%82%E5%9C%BA%20%E8%87%AA%E7%84%B6%E8%9E%8D%E8%B5%84%20%E7%94%9F%E7%89%A9%E5%A4%9A%E6%A0%B7%E6%80%A7%20%E4%BF%A1%E7%94%A8" },
  { id: "m-eu-cbam", title: "欧盟碳边境调节机制（CBAM）进入正式收费期", contentType: "ESG 政策", region: "欧盟", publishedAt: "2026-07-21", importanceLevel: "高", summary: "CBAM 结束过渡期进入正式机制：进口商须按季度申报进口商品隐含碳排放并购买 CBAM 证书，首批覆盖钢铁、铝、水泥、化肥、电力与氢。", sourceName: "欧盟委员会税务与海关同盟总司", sourceUrl: "https://taxation-customs.ec.europa.eu/", esgTopic: "温室气体排放", recommended: true,
    whyMatters: "信号：高 | 影响：成本、供应链. CBAM正式收费后出口欧盟的钢铁、铝、水泥等产品将直接产生碳成本。建议财务和供应链部门提前核算碳排放数据。",
    articleUrl: "https://www.google.com/search?q=site%3Acommission.europa.eu%20CBAM%20%E7%A2%B3%E8%BE%B9%E5%A2%83%E8%B0%83%E8%8A%82%20%E6%AD%A3%E5%BC%8F%E6%94%B6%E8%B4%B9%20%E9%92%A2%E9%93%81%20%E9%93%9D",
    impactAnalysis: {
      contentType: "ESG 政策",
      relevance: "高",
      whyThisMatters: "CBAM 正式收费意味着碳成本从即将发生变为正在发生，财务影响可量化。",
      impactLevel: "高",
      impactScore: 9,
      scoreBreakdown: { scope: 3, magnitude: 3, enforceability: 3 },
      affectedIndustries: ["钢铁","铝","水泥","化肥","电力","氢"],
      timeline: "已生效",
      effectiveDate: "2026-07-21",
      actionsRequired: ["建立碳排放核算能力","按季度申报隐含碳排放","购买CBAM证书","审查供应链碳排放数据"],
      keyClauses: ["进口商品须按季度申报隐含碳排放","证书价格与EU ETS配额价格挂钩","未申报将面临惩罚性默认值"]
    }
  },
  { id: "m-exp-omnibus", title: "专家点评欧盟综合简化法案：减负不等于免责", contentType: "专家观点", region: "欧盟", publishedAt: "2026-07-23", importanceLevel: "中", summary: "多位欧洲可持续法务专家就欧盟综合简化法案（Omnibus）发表评论：CSRD 与 CSDDD 的适用门槛和披露颗粒度虽被放宽，但企业不宜把简化解读为松绑。", sourceName: "CSR Europe", sourceUrl: "https://www.csreurope.org/", esgTopic: "合规与监管", recommended: true,
    whyMatters: "信号：中 | 影响：合规. 多位欧洲专家解读表明Omnibus减负不等于免责，企业不应因议题热度下降而放缓ESG合规准备。",
    articleUrl: "https://www.google.com/search?q=site%3Acsreurope.org%20Omnibus%20%E7%AE%80%E5%8C%96%E6%B3%95%E6%A1%88%20CSDDD%20CSRD%20%E8%A7%A3%E8%AF%BB" },
  { id: "m-exp-cbam-sme", title: "专家解读：CBAM 收费期对中小出口企业的三重冲击", contentType: "专家观点", region: "全球", publishedAt: "2026-07-19", importanceLevel: "中", summary: "智库专家指出 CBAM 正式收费对中小出口企业形成三重冲击：碳数据核算能力不足被迫接受惩罚性默认值、与进口商的数据协作缺乏议价能力、证书成本难以向下游转嫁。", sourceName: "WRI 评论", sourceUrl: "https://www.wri.org/", esgTopic: "供应链管理",
    articleUrl: "https://www.google.com/search?q=site%3Awri.org%20CBAM%20%E4%B8%AD%E5%B0%8F%E4%BC%81%E4%B8%9A%20%E7%A2%B3%E6%95%B0%E6%8D%AE%20%E5%87%BA%E5%8F%A3" },
  { id: "m-sg-issb", title: "新加坡可持续披露与绿色金融基础设施持续推进", contentType: "ESG 政策", region: "新加坡", publishedAt: "2026-07-18", importanceLevel: "中", summary: "新加坡金融管理局推进可持续披露路线图，上市公司及大型非上市公司将分阶段对标 ISSB 准则披露气候信息，绿色金融分类目录进一步完善。", sourceName: "新加坡金管局 (MAS)", sourceUrl: "https://www.mas.gov.sg/", esgTopic: "气候风险",
    articleUrl: "https://www.google.com/search?q=site%3Amas.gov.sg%20ISSB%20%E5%8F%AF%E6%8C%81%E7%BB%AD%E6%8A%AB%E9%9C%B2%20%E8%B7%AF%E7%BA%BF%E5%9B%BE%20%E6%96%B0%E5%8A%A0%E5%9D%A1" },
  { id: "m-rat-msci", title: "MSCI ESG 评级模型调整：气候脆弱性权重上调", contentType: "评级动态", region: "全球", publishedAt: "2026-07-17", importanceLevel: "中", summary: "MSCI 公布 ESG Ratings 年度模型调整：气候脆弱性议题在多数行业的关键议题权重上调，转型计划的披露质量开始影响治理维度得分。", sourceName: "MSCI ESG Research", sourceUrl: "https://www.msci.com/", esgTopic: "气候风险", recommended: true,
    whyMatters: "信号：中 | 影响：评级、披露. MSCI上调气候脆弱性权重可能影响多家企业的ESG评级得分变化。建议关注评级调整对投资者关系和融资成本的潜在影响。",
    articleUrl: "https://www.google.com/search?q=site%3Amsci.com%20ESG%20%E8%AF%84%E7%BA%A7%20%E6%A8%A1%E5%9E%8B%E8%B0%83%E6%95%B4%20%E6%B0%94%E5%80%99%E8%84%86%E5%BC%B1%E6%80%A7%202026",
    impactAnalysis: {
      contentType: "学术文章",
      relevance: "低",
      whyThisMatters: "该研究揭示了供应链合规传导的局限性——一级供应商受约束，二级以下影响甚微。",
      researchFinding: "合规压力主要通过采购合同条款从买方传导至一级供应商，对二级及以下供应商的治理改善效果有限，形成合规断层。",
      methodologyQuality: "中",
      practicalImplication: "企业若仅关注一级供应商合规，可能低估深层次供应链风险；建议将尽职调查延伸至次级供应商。",
      sourceCredibility: "中"
    }
  },
  { id: "m-aca-rating", title: "学术研究：ESG 评级分歧如何改变企业的披露策略", contentType: "学术文章", region: "全球", publishedAt: "2026-07-15", importanceLevel: "中", summary: "基于多国上市公司样本的研究发现，评级机构间分歧越大，企业越倾向于按最易得分的口径组织披露，而非按业务实质排序优先事项。", sourceName: "SSRN 工作论文", sourceUrl: "https://papers.ssrn.com/", esgTopic: "合规与监管",
    articleUrl: "https://www.google.com/search?q=site%3Assrn.com%20ESG%20%E8%AF%84%E7%BA%A7%E5%88%86%E6%AD%A7%20%E6%8A%AB%E9%9C%B2%E7%AD%96%E7%95%A5%20%E4%BC%81%E4%B8%9A" },
  { id: "m-rat-ecovadis", title: "EcoVadis 供应商评级方法说明更新", contentType: "评级动态", region: "全球", publishedAt: "2026-07-10", importanceLevel: "低", summary: "EcoVadis 更新评级方法说明文件，细化环境维度中范围三排放证据的计分口径，调整中小企业问卷的行业权重表。", sourceName: "EcoVadis", sourceUrl: "https://ecovadis.com/", esgTopic: "供应链管理",
    articleUrl: "https://www.google.com/search?q=site%3Aecovadis.com%20%E8%AF%84%E7%BA%A7%E6%96%B9%E6%B3%95%20%E6%9B%B4%E6%96%B0%202026%20%E4%BE%9B%E5%BA%94%E9%93%BE" },
  { id: "m-aca-supply", title: "学术研究：尽职调查立法对一级供应商治理的溢出效应", contentType: "学术文章", region: "全球", publishedAt: "2026-07-08", importanceLevel: "低", summary: "对欧盟成员国早期尽职调查立法的追踪研究显示，合规压力主要通过采购合同条款传导至一级供应商，二级及以下供应商的治理改善有限。", sourceName: "Journal of Business Ethics", sourceUrl: "https://link.springer.com/", esgTopic: "人权与劳工",
    articleUrl: "https://www.google.com/search?q=site%3Alink.springer.com%20%E5%B0%BD%E8%81%8C%E8%B0%83%E6%9F%A5%20%E4%BE%9B%E5%BA%94%E9%93%BE%20%E4%B8%80%E7%BA%A7%E4%BE%9B%E5%BA%94%E5%95%86%20%E6%B2%BB%E7%90%86" },
  { id: "m-exp-issb", title: "专家观点：ISSB 在亚洲进入密集落地期", contentType: "专家观点", region: "亚洲", publishedAt: "2026-07-12", importanceLevel: "低", summary: "随着新加坡、日本、香港等市场相继明确 ISSB 对标时间表，亚洲企业准备度呈两极分化：大型企业已进入鉴证准备阶段，多数中小企业尚未建立温室气体盘查基础。", sourceName: "PRI 评论", sourceUrl: "https://www.unpri.org/", esgTopic: "气候风险",
    articleUrl: "https://www.google.com/search?q=site%3Aunpri.org%20ISSB%20%E4%BA%9A%E6%B4%B2%20%E8%90%BD%E5%9C%B0%20%E5%AF%86%E9%9B%86%20%E6%8A%AB%E9%9C%B2%202026" },
  { id: "m-eu-forced-labor", title: "欧盟《禁止强迫劳动产品条例》进入执法准备阶段", contentType: "ESG 政策", region: "欧盟", publishedAt: "2026-07-28", importanceLevel: "高", summary: "欧盟《禁止强迫劳动产品条例》预计2027年底全面生效，成员国海关与市场监管机构开始搭建执法框架。企业须对供应链中强迫劳动风险开展尽职调查并建立追溯体系。", sourceName: "欧盟委员会", sourceUrl: "https://commission.europa.eu/", esgTopic: "人权与劳工", recommended: true,
    whyMatters: "信号：高 | 影响：合规、供应链. 欧盟强迫劳动禁令将要求企业建立全供应链追溯体系，对纺织、光伏、电子等行业影响显著。",
    articleUrl: "https://www.google.com/search?q=site%3Acommission.europa.eu%20%E5%BC%BA%E8%BF%AB%E5%8A%B3%E5%8A%A8%20%E4%BA%A7%E5%93%81%20%E6%9D%A1%E4%BE%8B%20%E5%B0%BD%E8%81%8C%E8%B0%83%E6%9F%A5%202026" },
  { id: "m-eu-gbs", title: "欧盟绿色债券标准（EUGBS）进入强制认证阶段", contentType: "ESG 政策", region: "欧盟", publishedAt: "2026-07-26", importanceLevel: "高", summary: "EUGBS 正式生效，在欧盟发行绿色债券须通过强制认证并与欧盟分类目录对齐，外部审查机构须在 ESMA 注册。预计将重塑全球绿色债券市场标准。", sourceName: "欧盟委员会", sourceUrl: "https://finance.ec.europa.eu/", esgTopic: "合规与监管", recommended: true,
    whyMatters: "信号：高 | 影响：融资、披露. EUGBS强制认证将提高绿色债券的合规门槛，准备不足的企业可能面临发行延误和额外认证成本。",
    articleUrl: "https://www.google.com/search?q=site%3Afinance.ec.europa.eu%20%E7%BB%BF%E8%89%B2%E5%80%BA%E5%88%B8%20EUGBS%20%E8%AE%A4%E8%AF%81%20%E5%BC%BA%E5%88%B6%20ESMA" },
  { id: "m-gbf-tnfd", title: "TNFD 自然相关披露框架获多国监管采纳", contentType: "ESG 政策", region: "全球", publishedAt: "2026-07-25", importanceLevel: "高", summary: "TNFD 框架发布后，英国、日本、瑞士等国家监管机构相继表态将在国内可持续披露标准中引入或参照 TNFD 的 LEAP 方法，要求企业评估和披露自然相关依赖、影响、风险与机遇。", sourceName: "TNFD", sourceUrl: "https://tnfd.global/", esgTopic: "气候风险", recommended: true,
    whyMatters: "信号：高 | 影响：披露、风险. TNFD被多个国家采纳将推动自然资本评估从自愿走向半强制，企业需尽早开展生物多样性基线调查。",
    articleUrl: "https://www.google.com/search?q=site%3Atnfd.global%20TNFD%20LEAP%20%E8%87%AA%E7%84%B6%20%E7%9B%B8%E5%85%B3%20%E6%8A%AB%E9%9C%B2%20%E6%A1%86%E6%9E%B6" },
  { id: "m-exp-climate-scenario", title: "专家分析：气候情景分析从定性到定量的过渡路径", contentType: "专家观点", region: "全球", publishedAt: "2026-07-22", importanceLevel: "中", summary: "NGFS 最新情景数据库发布后，多位气候风险专家撰写实践指引，建议企业分三阶段过渡：先识别气候相关物理风险的资产敞口，再做行业层面的定性评估，逐步嵌入财务建模中的定量分析。", sourceName: "NGFS / 碳信息披露项目 (CDP)", sourceUrl: "https://www.ngfs.net/", esgTopic: "气候风险", recommended: true,
    whyMatters: "信号：中 | 影响：风险、资本规划. 气候情景分析正从认知准备走向嵌入经营决策。",
    articleUrl: "https://www.google.com/search?q=site%3Angfs.net%20%E6%B0%94%E5%80%99%20%E6%83%85%E6%99%AF%20%E5%88%86%E6%9E%90%20%E5%AE%9A%E9%87%8F%20%E5%AE%9A%E6%80%A7%20%E8%BF%87%E6%B8%A1%20%E8%B7%AF%E5%BE%84" },
  { id: "m-exp-labor-supply", title: "专家观点：国际劳工标准在供应链合规中的新兴趋势", contentType: "专家观点", region: "全球", publishedAt: "2026-07-14", importanceLevel: "中", summary: "ILO 和国际工会组织联合报告指出，跨国企业供应链中的集体谈判权、合理工时与职业健康正成为新的审查重点。部分国家将工人代表权纳入可持续披露强制范围。", sourceName: "ILO 评论", sourceUrl: "https://www.ilo.org/", esgTopic: "人权与劳工",
    articleUrl: "https://www.google.com/search?q=site%3Ailo.org%20%E5%9B%BD%E9%99%85%E5%8A%B3%E5%B7%A5%E6%A0%87%E5%87%86%20%E4%BE%9B%E5%BA%94%E9%93%BE%20%E9%9B%86%E4%BD%93%E8%B0%88%E5%88%A4%20%E5%B0%BD%E8%81%8C%E8%B0%83%E6%9F%A5" },

];

export function getContentLink(item: ContentItem): string {
  return item.articleUrl ?? item.sourceUrl;
}

export function getAllContents(): ContentItem[] {
  return loadFromFile() ?? mockContents;
}

export function getContentById(id: string): ContentItem | undefined {
  const fileItems = loadFromFile();
  const hit = fileItems?.find((c) => c.id === id);
  if (hit) return hit;
  return mockContents.find((c) => c.id === id);
}
