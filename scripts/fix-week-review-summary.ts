// 为 ESG Today 周回顾补充详细中文摘要与正文摘要。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const ID = "src-5udi8w";

const summaryZh =
  "本周 ESG 焦点集中在可持续金融与气候披露：法国巴黎银行资管在收购安盛资管后推出新的全球可持续投资战略，摩根大通调整可持续金融策略以平衡减排与能源安全，Amundi 与法国巴黎银行资管合计赢得 16 亿欧元可持续投资委托，英国国际投资公司拟动员 16 亿美元支持东南亚气候融资。监管端，加州敲定企业气候披露规则，ESMA 发布防漂绿指引，TNFD 与 SBTN 联合推出自然目标设定与报告框架。企业侧，谷歌、Stripe、Shopify 与 44.01 签署碳去除协议，AEP 拟投建 40 亿美元燃料电池项目，Hy24 收购 EDF 旗下氢能平台，宜家任命新首席可持续发展官。";

const bodyZh =
  "本周值得关注的 ESG 重点如下：可持续金融方面，法国巴黎银行资管在完成对安盛资管的收购后发布新的全球可持续投资战略；摩根大通重新校准可持续金融战略，在推进减排目标的同时兼顾能源安全；Amundi 与法国巴黎银行资管合计赢得 16 亿欧元可持续投资委托；英国国际投资公司计划动员 16 亿美元用于东南亚气候融资。监管与披露方面，加州敲定企业气候报告法规；欧洲证券与市场管理局发布指引，要求基金管理人在气候与影响力相关声明中避免漂绿；TNFD 与 SBTN 联合发布自然目标设定与报告新框架。企业与科技方面，谷歌、Stripe、Shopify 与碳矿化初创公司 44.01 签署碳去除协议；AEP 拟建设 40 亿美元燃料电池项目为谷歌提供低碳电力；Hy24 从 EDF 收购清洁氢平台 Hynamics；EY 与 Watershed 合作推出可持续发展报告解决方案；宜家任命新首席可持续发展官。";

const contents = readPublishedContents();
const item = contents.find((entry) => entry.id === ID);
if (!item) {
  process.stderr.write(`item not found: ${ID}\n`);
  process.exitCode = 1;
} else {
  item.summaryZh = summaryZh;
  item.bodyZh = bodyZh;
  writePublishedContents(contents);
  process.stdout.write(`updated ${ID}: summaryZh=${summaryZh.length} bodyZh=${bodyZh.length}\n`);
}

export {};
