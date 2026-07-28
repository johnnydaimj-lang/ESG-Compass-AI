// ESG 快讯 — 内容数据与类型定义
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

export interface ContentItem {
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
  { id: "m-eu-csddd", title: "欧盟供应链尽职调查要求进入更强执行阶段", contentType: "ESG 政策", region: "欧盟", publishedAt: "2026-07-24", importanceLevel: "高", summary: "欧盟成员国监管机构开始依据 CSDDD 的转化立法开展首轮合规检查，重点覆盖在欧营业额达标的大型企业及其一级供应商，要求提供成文的尽职调查政策、风险图谱与整改计划。", sourceName: "欧盟委员会", sourceUrl: "https://commission.europa.eu/", esgTopic: "合规与监管" },
  { id: "m-eu-cbam", title: "欧盟碳边境调节机制（CBAM）进入正式收费期", contentType: "ESG 政策", region: "欧盟", publishedAt: "2026-07-21", importanceLevel: "高", summary: "CBAM 结束过渡期进入正式机制：进口商须按季度申报进口商品隐含碳排放并购买 CBAM 证书，首批覆盖钢铁、铝、水泥、化肥、电力与氢。", sourceName: "欧盟委员会税务与海关同盟总司", sourceUrl: "https://taxation-customs.ec.europa.eu/", esgTopic: "温室气体排放" },
  { id: "m-exp-omnibus", title: "专家点评欧盟综合简化法案：减负不等于免责", contentType: "专家观点", region: "欧盟", publishedAt: "2026-07-23", importanceLevel: "中", summary: "多位欧洲可持续法务专家就欧盟综合简化法案（Omnibus）发表评论：CSRD 与 CSDDD 的适用门槛和披露颗粒度虽被放宽，但企业不宜把简化解读为松绑。", sourceName: "CSR Europe", sourceUrl: "https://www.csreurope.org/", esgTopic: "合规与监管" },
  { id: "m-exp-cbam-sme", title: "专家解读：CBAM 收费期对中小出口企业的三重冲击", contentType: "专家观点", region: "全球", publishedAt: "2026-07-19", importanceLevel: "中", summary: "智库专家指出 CBAM 正式收费对中小出口企业形成三重冲击：碳数据核算能力不足被迫接受惩罚性默认值、与进口商的数据协作缺乏议价能力、证书成本难以向下游转嫁。", sourceName: "WRI 评论", sourceUrl: "https://www.wri.org/", esgTopic: "供应链管理" },
  { id: "m-sg-issb", title: "新加坡可持续披露与绿色金融基础设施持续推进", contentType: "ESG 政策", region: "新加坡", publishedAt: "2026-07-18", importanceLevel: "中", summary: "新加坡金融管理局推进可持续披露路线图，上市公司及大型非上市公司将分阶段对标 ISSB 准则披露气候信息，绿色金融分类目录进一步完善。", sourceName: "新加坡金管局 (MAS)", sourceUrl: "https://www.mas.gov.sg/", esgTopic: "气候风险" },
  { id: "m-rat-msci", title: "MSCI ESG 评级模型调整：气候脆弱性权重上调", contentType: "评级动态", region: "全球", publishedAt: "2026-07-17", importanceLevel: "中", summary: "MSCI 公布 ESG Ratings 年度模型调整：气候脆弱性议题在多数行业的关键议题权重上调，转型计划的披露质量开始影响治理维度得分。", sourceName: "MSCI ESG Research", sourceUrl: "https://www.msci.com/", esgTopic: "气候风险" },
  { id: "m-aca-rating", title: "学术研究：ESG 评级分歧如何改变企业的披露策略", contentType: "学术文章", region: "全球", publishedAt: "2026-07-15", importanceLevel: "中", summary: "基于多国上市公司样本的研究发现，评级机构间分歧越大，企业越倾向于按最易得分的口径组织披露，而非按业务实质排序优先事项。", sourceName: "SSRN 工作论文", sourceUrl: "https://papers.ssrn.com/", esgTopic: "合规与监管" },
  { id: "m-rat-ecovadis", title: "EcoVadis 供应商评级方法说明更新", contentType: "评级动态", region: "全球", publishedAt: "2026-07-10", importanceLevel: "低", summary: "EcoVadis 更新评级方法说明文件，细化环境维度中范围三排放证据的计分口径，调整中小企业问卷的行业权重表。", sourceName: "EcoVadis", sourceUrl: "https://ecovadis.com/", esgTopic: "供应链管理" },
  { id: "m-aca-supply", title: "学术研究：尽职调查立法对一级供应商治理的溢出效应", contentType: "学术文章", region: "全球", publishedAt: "2026-07-08", importanceLevel: "低", summary: "对欧盟成员国早期尽职调查立法的追踪研究显示，合规压力主要通过采购合同条款传导至一级供应商，二级及以下供应商的治理改善有限。", sourceName: "Journal of Business Ethics", sourceUrl: "https://link.springer.com/", esgTopic: "人权与劳工" },
  { id: "m-exp-issb", title: "专家观点：ISSB 在亚洲进入密集落地期", contentType: "专家观点", region: "亚洲", publishedAt: "2026-07-12", importanceLevel: "低", summary: "随着新加坡、日本、香港等市场相继明确 ISSB 对标时间表，亚洲企业准备度呈两极分化：大型企业已进入鉴证准备阶段，多数中小企业尚未建立温室气体盘查基础。", sourceName: "PRI 评论", sourceUrl: "https://www.unpri.org/", esgTopic: "气候风险" },
];

export function getAllContents(): ContentItem[] {
  return loadFromFile() ?? mockContents;
}

export function getContentById(id: string): ContentItem | undefined {
  const items = loadFromFile() ?? mockContents;
  return items.find((c) => c.id === id);
}
