// ESG 简报 — 内容数据与类型定义（当前阶段使用 mock 数据，后续迁移至 Prisma + libSQL）
// 数据模型以《产品说明.md》(v2) 第五节为准

export const CONTENT_TYPES = ["ESG 政策", "专家观点", "学术文章", "评级动态"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export type ImportanceLevel = "高" | "中" | "低";

export interface ContentItem {
  id: string;
  title: string;
  contentType: ContentType;
  region: string;
  publishedAt: string; // YYYY-MM-DD
  importanceLevel: ImportanceLevel;
  summary: string;
  businessImpact: string;
  whyImportant: string;
  riskTags: string[];
  topicTags: string[];
  sourceName: string;
  sourceUrl: string;
  actions: string[];
}

const mockContents: ContentItem[] = [
  // ---------- ESG 政策（3 条） ----------
  {
    id: "pol-eu-csddd-enforcement",
    title: "欧盟供应链尽职调查要求进入更强执行阶段",
    contentType: "ESG 政策",
    region: "欧盟",
    publishedAt: "2026-07-24",
    importanceLevel: "高",
    summary:
      "欧盟成员国监管机构开始依据《企业可持续发展尽职调查指令》(CSDDD) 的转化立法开展首轮合规检查，重点覆盖在欧营业额达标的大型企业及其一级供应商，要求提供成文的尽职调查政策、风险图谱与整改计划。",
    businessImpact:
      "对欧出口或设有欧盟实体的企业需直接面对监管层的尽职调查文件抽查；缺失风险图谱与申诉机制记录可能导致整改令或与营收挂钩的罚款，影响对欧业务连续性。",
    whyImportant:
      "指令从披露义务升级为可被执法的行为义务，检查节奏明显加快；多家成员国监管机构已公布抽查名单与问卷模板，属于确定性高的合规压力。",
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
  },
  {
    id: "pol-eu-cbam-definitive",
    title: "欧盟碳边境调节机制（CBAM）进入正式收费期",
    contentType: "ESG 政策",
    region: "欧盟",
    publishedAt: "2026-07-21",
    importanceLevel: "高",
    summary:
      "CBAM 结束过渡期进入正式机制：进口商须按季度申报进口商品隐含碳排放并购买 CBAM 证书，首批覆盖钢铁、铝、水泥、化肥、电力与氢，部分下游制品被纳入扩围评估。",
    businessImpact:
      "对欧出口覆盖品类企业的碳成本从“账面披露”变为“真金白银”：证书价格与欧盟碳价挂钩，碳数据质量直接决定成本高低；无法提供经核实排放数据的供应商将按偏高的默认值计征。",
    whyImportant:
      "绿色贸易壁垒从规则文本进入现金流层面，且默认值惩罚机制让“数据缺失”本身成为成本，属于当期就影响报价与订单的政策变化。",
    riskTags: ["成本上升", "贸易壁垒", "数据缺口"],
    topicTags: ["CBAM", "碳关税", "绿色贸易"],
    sourceName: "欧盟委员会税务与海关同盟总司",
    sourceUrl: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
    actions: [
      "盘点对欧出口产品是否在覆盖品类，测算不同排放口径下的证书成本",
      "与欧盟进口商确认申报责任分工与数据交付格式",
      "优先为核心品类建立经第三方核实的产品碳足迹数据",
    ],
  },
  {
    id: "pol-sg-issb-roadmap",
    title: "新加坡可持续披露与绿色金融基础设施持续推进",
    contentType: "ESG 政策",
    region: "新加坡",
    publishedAt: "2026-07-18",
    importanceLevel: "中",
    summary:
      "新加坡金融管理局与会计与企业管理局推进可持续披露路线图，上市公司及大型非上市公司将分阶段对标 ISSB 准则披露气候信息，绿色金融分类目录与转型信贷指引进一步完善。",
    businessImpact:
      "在新加坡上市、发债或设有区域总部的企业需提前布局气候数据与鉴证能力；披露口径与 ISSB 对齐后，现有 ESG 报告指标口径可能需要重述，影响融资材料的一致性。",
    whyImportant:
      "披露路线图明确了分阶段时间表，属于中期确定性义务；提前一年准备数据与鉴证能力可显著降低合规成本。",
    riskTags: ["披露合规"],
    topicTags: ["气候披露", "ISSB", "绿色金融"],
    sourceName: "新加坡金融管理局 (MAS)",
    sourceUrl: "https://www.mas.gov.sg/development/sustainable-finance",
    actions: [
      "梳理集团内适用新加坡披露路线图的法律实体清单",
      "对照 ISSB 准则评估现有气候指标的数据质量与鉴证准备度",
    ],
  },
  // ---------- 专家观点（3 条） ----------
  {
    id: "exp-omnibus-comment",
    title: "专家点评欧盟综合简化法案：减负不等于免责",
    contentType: "专家观点",
    region: "欧盟",
    publishedAt: "2026-07-23",
    importanceLevel: "中",
    summary:
      "多位欧洲可持续法务专家就欧盟“综合简化法案”(Omnibus) 发表评论：CSRD 与 CSDDD 的适用门槛和披露颗粒度虽被放宽，但供应链尽职调查的行为义务与成员国执法裁量并未同步缩减，企业不宜把“简化”解读为“松绑”。",
    businessImpact:
      "若企业依据“简化”的表层信号收缩合规投入，可能在成员国差异化执法和客户合同层面的尽调条款面前暴露缺口；合规预算的裁减决策需要按成员国逐个核对。",
    whyImportant:
      "政策文本与企业体感之间存在解读落差，专家共识是“披露减负、责任不减”——这直接决定企业今年合规投入的松紧判断。",
    riskTags: ["误判风险", "合规处罚"],
    topicTags: ["CSRD", "CSDDD", "监管解读"],
    sourceName: "CSR Europe 专家评论",
    sourceUrl: "https://www.csreurope.org/",
    actions: [
      "对照简化法案逐项核对本企业适用义务的实际变化，形成内部备忘录",
      "检查客户合同中的尽调与审计条款是否独立于法规门槛存在",
    ],
  },
  {
    id: "exp-cbam-sme-impact",
    title: "专家解读：CBAM 收费期对中小出口企业的三重冲击",
    contentType: "专家观点",
    region: "全球",
    publishedAt: "2026-07-19",
    importanceLevel: "中",
    summary:
      "智库专家指出 CBAM 正式收费对中小出口企业形成三重冲击：碳数据核算能力不足被迫接受惩罚性默认值、与进口商的数据协作缺乏议价能力、证书成本难以向下游转嫁，建议尽早嵌入行业级碳数据共算机制。",
    businessImpact:
      "中小供应商若各自为战，单位合规成本显著高于大型企业；通过行业协会或链主企业共享核算能力与数据模板，是压低边际成本的可行路径。",
    whyImportant:
      "观点把政策冲击拆解成可操作的三个层面，并给出“共算机制”这一非直觉解法，对资源有限的出口企业有直接参考价值。",
    riskTags: ["成本上升", "议价能力弱"],
    topicTags: ["CBAM", "中小企业", "碳数据"],
    sourceName: "世界资源研究所 (WRI) 评论",
    sourceUrl: "https://www.wri.org/",
    actions: [
      "评估本企业碳核算能力缺口，对比自建与加入行业共算机制的成本",
      "主动与主要欧盟进口商开启数据协作与成本分担谈判",
    ],
  },
  {
    id: "exp-issb-asia-readiness",
    title: "专家观点：ISSB 在亚洲进入密集落地期，企业准备度两极分化",
    contentType: "专家观点",
    region: "亚洲",
    publishedAt: "2026-07-12",
    importanceLevel: "低",
    summary:
      "责任投资专家观察指出，随着新加坡、日本、香港等市场相继明确 ISSB 对标时间表，亚洲企业的准备度呈两极分化：大型企业已进入鉴证准备阶段，多数中小企业尚未建立温室气体盘查基础，差距将在两个披露周期内显性化。",
    businessImpact:
      "准备度差距会沿供应链传导：大型链主为满足自身披露与鉴证要求，将向上游索取可验证的数据，未准备的中小供应商面临被降级或替换的风险。",
    whyImportant:
      "这是判断“披露压力何时传导到自己身上”的参照系——链主的披露截止日就是供应商的数据准备截止日。",
    riskTags: ["供应链传导"],
    topicTags: ["ISSB", "披露准备", "亚洲市场"],
    sourceName: "PRI（负责任投资原则组织）评论",
    sourceUrl: "https://www.unpri.org/",
    actions: [
      "确认主要客户的披露时间表，倒排本企业数据准备节点",
      "优先建立范围一、二温室气体盘查的基础台账",
    ],
  },
  // ---------- 学术文章（2 条） ----------
  {
    id: "aca-rating-divergence",
    title: "学术研究：ESG 评级分歧如何改变企业的披露策略",
    contentType: "学术文章",
    region: "全球",
    publishedAt: "2026-07-15",
    importanceLevel: "中",
    summary:
      "基于多国上市公司样本的研究发现，评级机构间分歧越大，企业越倾向于按“最易得分”的口径组织披露，而非按业务实质排序优先事项；分歧每扩大一个标准差，企业披露指标的口径切换频率显著上升。",
    businessImpact:
      "以“追评级”为导向的披露策略在评级口径切换时会产生重述成本与可信度损耗；研究支持以业务实质重要性为锚、兼容多口径的披露架构。",
    whyImportant:
      "为企业“披露资源往哪投”提供了实证依据：盯住实质议题比追逐单一评级口径的长期成本更低。",
    riskTags: [],
    topicTags: ["ESG 评级", "披露策略", "实证研究"],
    sourceName: "SSRN 工作论文",
    sourceUrl: "https://papers.ssrn.com/",
    actions: [
      "用实质重要性矩阵复核现有披露指标的排序依据",
      "建立一套底层数据、多套披露口径的指标架构，降低口径切换成本",
    ],
  },
  {
    id: "aca-supply-chain-dd-effect",
    title: "学术研究：尽职调查立法对一级供应商治理的溢出效应",
    contentType: "学术文章",
    region: "全球",
    publishedAt: "2026-07-08",
    importanceLevel: "低",
    summary:
      "对欧盟成员国早期尽职调查立法的追踪研究显示，合规压力主要通过采购合同条款传导至一级供应商，二级及以下供应商的治理改善有限；研究建议政策与企业端引入“分层尽调”与能力共建机制。",
    businessImpact:
      "作为采购方，仅把尽调条款写入合同难以触及深层供应链风险；作为供应商，提前具备分层数据能力可在链主筛选中获得相对优势。",
    whyImportant:
      "研究揭示了尽调传导链的衰减点，为企业判断“尽调做到第几层才够”提供证据支持。",
    riskTags: [],
    topicTags: ["尽职调查", "供应链治理", "政策评估"],
    sourceName: "Journal of Business Ethics",
    sourceUrl: "https://link.springer.com/journal/10551",
    actions: [
      "评估现有尽调条款在二级以下供应商的覆盖盲区",
      "优先对高风险品类试点分层尽调与数据共建",
    ],
  },
  // ---------- 评级动态（2 条） ----------
  {
    id: "rat-msci-model-update",
    title: "MSCI ESG 评级模型调整：气候脆弱性权重上调",
    contentType: "评级动态",
    region: "全球",
    publishedAt: "2026-07-17",
    importanceLevel: "中",
    summary:
      "MSCI 公布 ESG Ratings 年度模型调整：气候脆弱性议题在多数行业的关键议题权重上调，转型计划的披露质量开始影响治理维度得分，新一轮评级自下一季度起按新模型执行。",
    businessImpact:
      "被 MSCI 覆盖的上市公司评级可能因权重重排而波动，进而影响 ESG 基金持仓与融资成本；转型计划披露薄弱的企业面临下调风险。",
    whyImportant:
      "评级模型变化先于市场定价变化，提前对照新权重自查是平滑评级波动的低成本手段。",
    riskTags: ["评级下调", "融资成本"],
    topicTags: ["MSCI", "评级方法", "气候风险"],
    sourceName: "MSCI ESG Research",
    sourceUrl: "https://www.msci.com/our-solutions/esg-investing/esg-ratings-climate-search-tool",
    actions: [
      "获取本行业新模型的关键议题权重表，逐项自评",
      "补强转型计划披露的可验证细节（目标、路径、资本配置）",
    ],
  },
  {
    id: "rat-ecovadis-methodology",
    title: "EcoVadis 供应商评级方法说明更新",
    contentType: "评级动态",
    region: "全球",
    publishedAt: "2026-07-10",
    importanceLevel: "低",
    summary:
      "EcoVadis 更新评级方法说明文件，细化环境维度中范围三排放证据的计分口径，并调整中小企业问卷的行业权重表，新一轮评级按新口径执行。",
    businessImpact:
      "正在准备或即将接受 EcoVadis 复评的供应商需按新口径重估自评得分；范围三证据不足的企业评级可能下滑，影响要求最低评级的客户准入。",
    whyImportant:
      "评级口径变化直接影响分数可预期性，提前校准自评能避免复评时的分数意外下滑。",
    riskTags: ["评级下滑"],
    topicTags: ["EcoVadis", "评级方法", "供应商准入"],
    sourceName: "EcoVadis",
    sourceUrl: "https://support.ecovadis.com/",
    actions: [
      "下载新版方法说明，比对环境维度计分口径变化",
      "按新口径重跑一次内部自评，识别可能掉分的证据缺口",
    ],
  },
];

export function getAllContents(): ContentItem[] {
  return mockContents;
}

export function getContentById(id: string): ContentItem | undefined {
  return mockContents.find((c) => c.id === id);
}
