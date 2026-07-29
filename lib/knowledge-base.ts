// ESG Compass — 知识库（基础版）
// 由事件数据 + 标准法规条目构成，供 AI 问答检索

export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  category: "法规" | "标准" | "解读" | "实践";
}

// 从事件数据构建基础知识条目
export var KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ── 法规类 ──
  {
    id: "kb-csddd", title: "欧盟企业可持续发展尽职调查指令（CSDDD）",
    summary: "要求大型企业对其自身运营、子公司及价值链开展人权与环境尽职调查",
    content: "CSDDD（Corporate Sustainability Due Diligence Directive）于 2024 年 5 月由欧盟理事会正式通过，分阶段自 2027 年起适用。适用企业须：1）将尽职调查纳入企业政策；2）识别并评估实际和潜在的不利影响；3）采取适当措施预防、减轻或终止不利影响；4）建立投诉机制；5）监测措施有效性；6）公开沟通尽职调查情况。违规企业可处最高全球营业额 5% 的罚款。",
    sourceName: "欧盟委员会", sourceUrl: "https://commission.europa.eu/", tags: ["供应链", "人权", "环境", "欧盟"], category: "法规"
  },
  {
    id: "kb-cbam", title: "欧盟碳边境调节机制（CBAM）",
    summary: "CBAM 正式收费期要求进口商按季度申报隐含碳排放并购买证书",
    content: "CBAM 于 2023 年 10 月进入过渡期，2026 年 7 月进入正式收费期。进口商须：1）按季度申报进口商品（钢铁、铝、水泥、化肥、电力、氢）的隐含碳排放；2）购买并提交 CBAM 证书；3）证书价格与 EU ETS 配额价格挂钩；4）接受核查机构对申报数据的核查。",
    sourceName: "欧盟税务与海关同盟总司", sourceUrl: "https://taxation-customs.ec.europa.eu/", tags: ["碳", "贸易", "供应链", "欧盟"], category: "法规"
  },
  {
    id: "kb-issb", title: "ISSB 可持续披露准则（IFRS S1/S2）",
    summary: "全球统一的可持续相关财务信息披露基准",
    content: "ISSB 于 2023 年 6 月发布 IFRS S1（一般要求）和 S2（气候相关披露）。S1 要求企业披露其面临的重要可持续相关风险和机遇。S2 专门针对气候相关风险和机遇，要求披露范围一、二、三排放。多个管辖区（新加坡、日本、香港等）已明确对标时间表。",
    sourceName: "ISSB", sourceUrl: "https://www.ifrs.org/groups/international-sustainability-standards-board/", tags: ["披露", "气候", "全球"], category: "标准"
  },
  {
    id: "kb-csrd", title: "欧盟企业可持续发展报告指令（CSRD）",
    summary: "CSRD 取代 NFRD，大幅扩大适用企业范围并按 ESRS 披露",
    content: "CSRD 自 2024 年 1 月起分阶段生效。适用企业须按欧洲可持续报告标准（ESRS）进行双重重要性评估，披露环境、社会、治理维度的可持续信息。首批大型企业于 2025 年报告 2024 财年数据。",
    sourceName: "欧盟委员会", sourceUrl: "https://finance.ec.europa.eu/", tags: ["披露", "ESG", "欧盟"], category: "法规"
  },
  {
    id: "kb-cbam-sme", title: "CBAM 对中小出口企业的三重冲击",
    summary: "智库专家分析 CBAM 正式收费对中小企业的影响",
    content: "中小出口企业面临三重冲击：1）碳数据核算能力不足而被迫接受惩罚性默认值；2）与进口商的数据协作缺乏议价能力；3）证书成本难以向下游转嫁。建议中小企业尽早建立碳排放核算能力，优先完成盘查基础建设。",
    sourceName: "WRI 评论", sourceUrl: "https://www.wri.org/", tags: ["碳", "贸易", "中小企业"], category: "解读"
  },
  {
    id: "kb-msci-rating", title: "MSCI ESG 评级模型调整",
    summary: "MSCI 上调气候脆弱性权重，转型计划披露影响治理维度得分",
    content: "MSCI 2026 年度模型调整主要变化：1）气候脆弱性议题在多数行业的关键议题权重上调；2）转型计划的披露质量开始影响治理维度得分；3）调整后部分行业评级可能发生变化。评级变化可能影响投资者关系和融资成本。",
    sourceName: "MSCI ESG Research", sourceUrl: "https://www.msci.com/", tags: ["评级", "气候", "披露"], category: "解读"
  },
  {
    id: "kb-sg-issb", title: "新加坡可持续披露与绿色金融路线图",
    summary: "新加坡分阶段对标 ISSB 准则，推进绿色金融分类目录",
    content: "新加坡金融管理局推进可持续披露路线图：上市公司及大型非上市公司将分阶段对标 ISSB 准则披露气候信息。绿色金融分类目录进一步完善，为金融机构识别绿色活动提供指引。",
    sourceName: "新加坡金管局（MAS）", sourceUrl: "https://www.mas.gov.sg/", tags: ["披露", "亚洲", "金融"], category: "法规"
  },
  // ── 标准类 ──
  {
    id: "kb-sasb", title: "SASB（可持续会计标准委员会）标准",
    summary: "行业特定的可持续相关财务信息披露标准",
    content: "SASB 标准覆盖 77 个行业，每个行业有 6 个左右的关键可持续议题。标准按通用议题分类呈现（环境、社会资本、人力资本、商业模式与创新、领导力与治理）。已被 ISSB 整合，但行业分类框架仍广泛使用。",
    sourceName: "SASB / IFRS Foundation", sourceUrl: "https://www.sasb.org/", tags: ["披露", "标准", "行业"], category: "标准"
  },
  {
    id: "kb-gri", title: "GRI（全球报告倡议组织）标准",
    summary: "最广泛使用的可持续发展报告标准体系",
    content: "GRI 标准分为通用标准（GRI 1/2/3）、议题标准（GRI 200/300/400 系列）。采用双重重要性原则，涵盖经济、环境、社会三大维度。2023 年发布最新更新，强调人权尽职调查与供应链披露。",
    sourceName: "GRI", sourceUrl: "https://www.globalreporting.org/", tags: ["披露", "标准", "全球"], category: "标准"
  },
  {
    id: "kb-tcfd", title: "TCFD（气候相关财务信息披露工作组）框架",
    summary: "气候相关风险与机遇的披露框架",
    content: "TCFD 框架围绕治理、战略、风险管理、指标与目标四个维度建议企业披露气候相关信息。已被 ISSB S2 实质性整合采纳。虽已解散，但其框架逻辑仍是气候披露的行业基线。",
    sourceName: "FSB TCFD", sourceUrl: "https://www.fsb-tcfd.org/", tags: ["气候", "披露", "风险"], category: "标准"
  },
];

// 搜索知识库（简单关键词匹配 + 标签匹配）
export function searchKnowledgeBase(query: string, limit: number = 3): KnowledgeEntry[] {
  var q = query.toLowerCase();
  var scored = KNOWLEDGE_BASE.map(function (entry) {
    var score = 0;
    // 标签匹配
    entry.tags.forEach(function (tag) {
      if (q.includes(tag.toLowerCase())) score += 3;
    });
    // 标题匹配
    if (entry.title.toLowerCase().includes(q)) score += 5;
    // 摘要匹配
    if (entry.summary.toLowerCase().includes(q)) score += 2;
    // 内容匹配
    if (entry.content.toLowerCase().includes(q)) score += 1;
    return { entry: entry, score: score };
  });
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.filter(function (s) { return s.score > 0; }).slice(0, limit).map(function (s) { return s.entry; });
}

// 根据事件 ID 获取关联知识条目
export function getRelatedKnowledge(eventId: string): KnowledgeEntry[] {
  // 从事件 ID 推断关联的知识条目
  var map: Record<string, string[]> = {
    "m-eu-csddd": ["kb-csddd", "kb-csrd"],
    "m-eu-cbam": ["kb-cbam", "kb-cbam-sme"],
    "m-exp-omnibus": ["kb-csrd", "kb-csddd"],
    "m-exp-cbam-sme": ["kb-cbam", "kb-cbam-sme"],
    "m-sg-issb": ["kb-sg-issb", "kb-issb"],
    "m-rat-msci": ["kb-msci-rating"],
    "m-rat-ecovadis": [],
    "m-aca-rating": ["kb-sasb"],
    "m-aca-supply": ["kb-csddd"],
    "m-exp-issb": ["kb-issb", "kb-sg-issb"],
  };
  var ids = map[eventId] || [];
  return ids.map(function (id) { return KNOWLEDGE_BASE.find(function (k) { return k.id === id; }); }).filter(Boolean) as KnowledgeEntry[];
}
