// 为「周更新 / 回顾 / 关键更新汇总」类内容补全首页与详情摘要。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const UPDATES: Record<string, { summaryZh: string; bodyZh: string }> = {
  "src-orvtsu": {
    summaryZh:
      "本周聚焦企业人权与社区风险：澳大利亚数据中心计划因社区抗议和监管担忧被撤回；民间社会组织就 IFC/MIGA 环境与社会标准审查提出建议；伦敦金银市场协会因坦桑尼亚金矿“负责任”认证被诉；哥伦比亚 11 名农民因反对铜矿项目面临刑事指控；孟加拉国亚投行资助的垃圾发电项目因污染遭社区反对；挪威以隐私担忧限制智能眼镜。",
    bodyZh:
      "本期每周更新聚焦企业人权与社区风险：澳大利亚一处数据中心计划因社区抗议和监管担忧被撤回。标准与治理方面，民间社会组织就国际金融公司（IFC）与世界银行集团多边投资担保机构（MIGA）环境与社会标准的审查提出建议。司法与合规方面，英国伦敦金银市场协会因坦桑尼亚金矿的“负责任”认证被提起诉讼，相关审判已开始；哥伦比亚 Jericó 地区 11 名农民因反对铜矿项目面临刑事指控。社区与环境方面，孟加拉国由亚洲基础设施投资银行和新开发银行资助的垃圾发电项目因污染和健康问题遭当地社区反对；挪威以隐私担忧为由限制智能眼镜使用。",
  },
  "src-web-search-esg-regulations-2026-key-updates-compliance-know-b547": {
    summaryZh:
      "2026 年 ESG 法规关键更新与合规要点：覆盖欧盟 CSRD、CSDDD、英国 SRS，以及美国 SEC 与加州气候披露规则，并给出面向团队的合规决策指南。",
    bodyZh:
      "本文梳理 2026 年 ESG 法规的关键更新与合规要点：欧盟方面，《企业可持续发展报告指令》（CSRD）扩大可持续发展报告的适用范围与披露要求，《企业可持续发展尽职调查指令》（CSDDD）要求企业对其供应链进行人权与环境尽职调查；英国方面，英国可持续报告标准（UK SRS）持续推进；美国方面，SEC 气候披露规则与加州气候披露法规要求企业披露温室气体排放与气候相关风险。文章还提供面向团队的实用合规决策指南，帮助企业判断自身适用哪些规则、关键披露时间表与行动优先级。",
  },
};

const contents = readPublishedContents();
let updated = 0;
for (const item of contents) {
  const patch = UPDATES[item.id];
  if (!patch) continue;
  item.summaryZh = patch.summaryZh;
  item.bodyZh = patch.bodyZh;
  updated += 1;
}
writePublishedContents(contents);
process.stdout.write(`review digests updated: ${updated}\n`);

export {};
