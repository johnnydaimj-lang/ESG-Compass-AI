// 精选内容推荐理由：去掉综合评分，改为更充分的事件解释。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const REASONS: Record<string, string> = {
  "src-qvlbt2":
    "加州正式敲定企业气候报告规则并锁定 2026 年 11 月首个截止日期，直接影响在加州经营的大型企业的披露义务与合规时间表。",
  "src-mof-climate-disclosure-appguide-2026":
    "财政部首次就气候准则配套应用指南及电力、钢铁、煤炭、石油等 9 个重点行业应用指南公开征求意见，是可持续披露准则落地的关键一步。",
  "src-web-search-5-august-2026-a-turning-point-for-supply-chain-d-a10a":
    "文章分析 2026 年 8 月 5 日中国供应链尽职调查规则变化的影响，为企业判断合规义务与供应链管理调整提供参考。",
  "src-esgtoday-eu-publishes-final-revised-european-sustainabili-7ffa":
    "欧盟在官方公报发布最终修订版欧洲可持续发展报告标准（ESRS），直接影响 CSRD 适用企业的披露口径与实施节奏。",
  "src-bhrrc-latest-from-invisibility-to-protection-ilo-adopts-landm-074a":
    "国际劳工组织通过平台工人保护里程碑标准，反映劳工权利治理的最新进展，对平台经济与供应链人权尽职调查具有参考意义。",
  "src-mofcom-china-rba-counter-list-20260805":
    "商务部将责任商业联盟等列入反制清单，涉及供应链尽职调查与跨境合规，对出口企业的供应链管理有直接影响。",
  "src-mofcom-china-drone-export-control-20260805":
    "商务部加强无人机相关两用物项对美出口管制，涉及出口合规与供应链风险管理，相关企业需关注许可与最终用户要求。",
  "src-mofcom-china-us-compliance-tester-counter-20260805":
    "商务部对美国合规性测试公司采取反制措施，涉及跨境合规与供应链审计安排，相关企业需评估合规测试路径。",
  "src-norway-swf-ethics-2026":
    "挪威独立委员会建议修改全球最大主权财富基金的道德投资准则，允许重新投资部分参与核武器生产的西方国防企业，涉及道德排除机制与国防产业投资的再平衡。",
  "src-eu-summit-energy-carbon-2026":
    "欧盟领导人在布鲁塞尔峰会上讨论能源价格上涨与碳市场改革，涉及工业竞争力、电力市场设计与减排目标的平衡，直接影响欧盟气候政策走向。",
  "src-un-global-biodiversity-action-report-2026":
    "联合国首次系统评估《昆明—蒙特利尔全球生物多样性框架》的实施进展，梳理各国在目标、政策、监测与资金方面的差距，是生物多样性治理的重要基准。",
  "src-tpi-banking-transition-2026":
    "TPI 评估全球 36 家大型银行的气候承诺、转型计划与风险管理，发现过去三年整体气候雄心下降、部分机构撤销净零承诺，对银行转型与融资排放管理具有警示意义。",
  "src-esma-sustainable-finance-briefings-2026":
    "ESMA 就影响力投资与气候转型声明发布监管说明，统一基金管理人的表述与证据要求，直接关系可持续金融产品的披露与防漂绿。",
  "src-wef-cso-outlook-2026":
    "世界经济论坛发布首份《首席可持续发展官展望》，系统观察企业可持续治理职能的角色、优先议题与能力需求，对理解全球企业 ESG 治理演进具有参考价值。",
};

const contents = readPublishedContents();
let updated = 0;
for (const item of contents) {
  const reason = REASONS[item.id];
  if (!reason) continue;
  item.recommendReason = reason;
  updated += 1;
}
writePublishedContents(contents);
process.stdout.write(`recommend reasons updated: ${updated}\n`);

export {};
