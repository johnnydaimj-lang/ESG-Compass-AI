// 补录用户指定的 2026 年 9-10 月 ESG 重点事件，并完善两条已有事件的摘要。

import type { ContentItem } from "@/lib/contracts/content";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const NEW_ITEMS: ContentItem[] = [
  {
    id: "src-wef-cso-outlook-2026",
    title: "Chief Sustainability Officer Outlook 2026",
    titleZh: "世界经济论坛发布首份《首席可持续发展官展望》",
    summary:
      "The World Economic Forum published its first Chief Sustainability Officer Outlook, examining the evolving role, priorities and capabilities of corporate sustainability leaders.",
    summaryZh:
      "世界经济论坛发布首份《首席可持续发展官展望》，聚焦首席可持续发展官在企业战略中的角色、优先议题与能力需求，为观察全球企业可持续发展治理趋势提供参考。",
    contentType: "观点",
    region: "全球",
    publishedAt: "2026-09-23T08:00:00.000Z",
    importanceLevel: "中",
    sourceName: "世界经济论坛（WEF）",
    sourceUrl: "https://www.weforum.org/publications/chief-sustainability-officer-outlook-2026/",
    articleUrl: "https://www.weforum.org/publications/chief-sustainability-officer-outlook-2026/",
    esgTopic: "合规与监管",
    recommended: true,
    recommendReason: "首份面向首席可持续发展官的全球展望，观察企业可持续治理职能的演进。",
    bodyZh:
      "世界经济论坛发布其首份《首席可持续发展官展望》，基于对全球首席可持续发展官的调研，梳理企业在气候与可持续发展议题上的优先事项、组织定位、跨部门协作与能力建设方向，并讨论首席可持续发展官如何在战略制定、信息披露与业务转型中发挥作用。报告为理解全球企业可持续发展治理职能的演进提供了第一份系统性参考。",
    pipeline: {
      score: 78,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-wef-cso-outlook-2026",
      heat: 0,
      tags: ["观点", "合规与监管", "全球"],
      fact: {
        title: "世界经济论坛发布首份《首席可持续发展官展望》",
        subject: "世界经济论坛",
        action: "发布",
        object: "《首席可持续发展官展望》",
        occurredAt: "2026-09-23",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-gcf-kuwait-fund-mou-2026",
    title:
      "Green Climate Fund and Kuwait Fund sign MoU to strengthen climate finance cooperation for developing countries",
    titleZh: "绿色气候基金与科威特发展基金签署气候融资合作谅解备忘录",
    summary:
      "The Green Climate Fund and the Kuwait Fund for Arab Economic Development signed an MoU during the World Bank/IMF Annual Meetings to strengthen joint support for climate projects in developing countries.",
    summaryZh:
      "在世界银行与国际货币基金组织年会期间，绿色气候基金（GCF）与科威特发展基金签署合作谅解备忘录，计划加强对发展中国家气候项目的共同支持，拓展气候融资渠道。",
    contentType: "行业",
    region: "全球",
    publishedAt: "2026-10-14T00:00:00.000Z",
    importanceLevel: "中",
    sourceName: "绿色气候基金（GCF）",
    sourceUrl:
      "https://www.greenclimate.fund/about/news-and-updates/green-climate-fund-and-kuwait-fund-sign-mou-strengthen-climate-finance-cooperation-developing-countries",
    articleUrl:
      "https://www.greenclimate.fund/about/news-and-updates/green-climate-fund-and-kuwait-fund-sign-mou-strengthen-climate-finance-cooperation-developing-countries",
    esgTopic: "气候风险",
    recommended: false,
    bodyZh:
      "在世界银行与国际货币基金组织年会期间，绿色气候基金（GCF）与科威特发展基金签署合作谅解备忘录，计划通过联合融资、项目开发与知识共享等方式，加强对发展中国家气候项目的共同支持。此举旨在拓展气候融资渠道，推动更多公共与私人资本流向减缓和适应项目。",
    pipeline: {
      score: 74,
      scoreThreshold: 75,
      scorePass: false,
      sourceTier: "T1",
      storyId: "story-gcf-kuwait-fund-mou-2026",
      heat: 0,
      tags: ["行业", "气候风险", "全球"],
      fact: {
        title: "绿色气候基金与科威特发展基金签署气候融资合作谅解备忘录",
        subject: "绿色气候基金",
        action: "签署合作谅解备忘录",
        object: "科威特发展基金",
        occurredAt: "2026-10-14",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-norway-swf-ethics-2026",
    title: "Norway committee recommends revising sovereign wealth fund ethical guidelines",
    titleZh: "挪威委员会建议修改主权财富基金道德投资准则",
    summary:
      "An independent committee appointed by the Norwegian government recommended revising the ethical guidelines of the world's largest sovereign wealth fund, allowing it to reinvest in some Western defence companies involved in nuclear weapons production.",
    summaryZh:
      "挪威政府委任的独立委员会建议修改全球最大主权财富基金——挪威政府全球养老基金的道德投资准则，允许基金重新投资部分参与核武器生产的西方国防企业。",
    contentType: "政策",
    region: "挪威",
    publishedAt: "2026-10-15T00:00:00.000Z",
    importanceLevel: "高",
    sourceName: "挪威政府",
    sourceUrl: "https://www.regjeringen.no/en/",
    articleUrl: "https://www.regjeringen.no/en/",
    esgTopic: "合规与监管",
    recommended: true,
    recommendReason: "涉及全球最大主权财富基金的道德投资准则调整，影响范围广。",
    bodyZh:
      "挪威政府委任的独立委员会建议修改全球最大主权财富基金——挪威政府全球养老基金的道德投资准则，允许基金重新投资部分参与核武器生产的西方国防企业。该建议涉及基金长期执行的排除与观察名单机制，后续将进入政府审议程序。委员会认为，在安全环境变化背景下，有必要重新平衡道德约束与国防产业投资之间的关系。",
    pipeline: {
      score: 86,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-norway-swf-ethics-2026",
      heat: 0,
      tags: ["政策", "合规与监管", "挪威"],
      fact: {
        title: "挪威委员会建议修改主权财富基金道德投资准则",
        subject: "挪威政府独立委员会",
        action: "建议修改",
        object: "主权财富基金道德投资准则",
        occurredAt: "2026-10-15",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-eu-summit-energy-carbon-2026",
    title: "EU leaders discuss energy prices and carbon market reform at Brussels summit",
    titleZh: "欧盟领导人布鲁塞尔峰会讨论能源价格与碳市场改革",
    summary:
      "EU leaders discussed rising energy prices and carbon market reform at the Brussels summit on 15-16 October, focusing on industrial competitiveness amid high energy costs.",
    summaryZh:
      "10月15日至16日，欧盟领导人在布鲁塞尔峰会上讨论能源价格上涨及碳市场改革，重点涉及如何在高能源成本下保持工业竞争力，同时推进减排与碳市场机制调整。",
    contentType: "政策",
    region: "欧盟",
    publishedAt: "2026-10-15T00:00:00.000Z",
    importanceLevel: "高",
    sourceName: "欧洲理事会",
    sourceUrl: "https://www.consilium.europa.eu/en/",
    articleUrl: "https://www.consilium.europa.eu/en/",
    esgTopic: "气候风险",
    recommended: true,
    recommendReason: "欧盟最高层就可负担能源与碳市场改革展开讨论，直接影响气候政策走向。",
    bodyZh:
      "10月15日至16日，欧盟领导人在布鲁塞尔峰会上讨论能源价格上涨及碳市场改革。会议重点涉及如何在高能源成本背景下保持工业竞争力，同时推进减排目标与碳市场机制调整。讨论还涉及电力市场设计、碳价传导以及对低收入家庭和能源密集型产业的缓冲措施，反映欧盟在气候目标与能源安全之间寻求平衡。",
    pipeline: {
      score: 84,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-eu-summit-energy-carbon-2026",
      heat: 0,
      tags: ["政策", "气候风险", "欧盟"],
      fact: {
        title: "欧盟领导人布鲁塞尔峰会讨论能源价格与碳市场改革",
        subject: "欧盟领导人",
        action: "讨论",
        object: "能源价格与碳市场改革",
        occurredAt: "2026-10-15",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-tpi-banking-transition-2026",
    title: "Banking Transition Status Report 2026",
    titleZh: "TPI发布《2026年银行业转型状况报告》：大型银行气候雄心下降",
    summary:
      "The TPI Global Climate Transition Centre released its 2026 Banking Transition Status Report, assessing climate commitments, transition plans and risk management at 36 major banks.",
    summaryZh:
      "伦敦政治经济学院旗下TPI全球气候转型中心发布《2026年银行业转型状况报告》，评估全球36家大型银行的气候承诺、转型计划及风险管理。研究发现，过去三年银行整体气候雄心有所下降，部分机构撤销了净零承诺和行业减排目标。",
    contentType: "观点",
    region: "全球",
    publishedAt: "2026-10-13T00:00:00.000Z",
    importanceLevel: "中",
    sourceName: "TPI 全球气候转型中心",
    sourceUrl: "https://transitionpathwayinitiative.org/",
    articleUrl: "https://transitionpathwayinitiative.org/",
    esgTopic: "气候风险",
    recommended: true,
    recommendReason: "系统评估36家大型银行的气候承诺与转型进展，揭示雄心回落趋势。",
    bodyZh:
      "伦敦政治经济学院旗下TPI全球气候转型中心发布《2026年银行业转型状况报告》，评估全球36家大型银行的气候承诺、转型计划及风险管理。研究发现，过去三年银行整体气候雄心有所下降，部分机构撤销了净零承诺和行业减排目标，转型计划与融资排放管理进展不均。报告认为，银行需要更清晰的转型治理、目标设定与信息披露，以支撑可信的净零转型。",
    pipeline: {
      score: 79,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1_5",
      storyId: "story-tpi-banking-transition-2026",
      heat: 0,
      tags: ["观点", "气候风险", "全球"],
      fact: {
        title: "TPI发布《2026年银行业转型状况报告》",
        subject: "TPI 全球气候转型中心",
        action: "发布",
        object: "《2026年银行业转型状况报告》",
        occurredAt: "2026-10-13",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-esma-sustainable-finance-briefings-2026",
    title: "ESMA promotes clarity in claims on impact and transition",
    titleZh: "ESMA发布两份可持续金融监管说明：影响力投资与气候转型声明",
    summary:
      "ESMA published two sustainable finance supervisory briefings on impact investing claims and climate transition claims, clarifying expectations on clear, accurate and not misleading statements.",
    summaryZh:
      "10月12日，欧洲证券及市场管理局（ESMA）发布两份可持续金融专题监管说明，分别针对影响力投资声明和气候转型声明，明确基金管理人在相关表述中应遵循的清晰、准确与不误导要求，防范漂绿风险。",
    contentType: "政策",
    region: "欧盟",
    publishedAt: "2026-10-12T00:00:00.000Z",
    importanceLevel: "中",
    sourceName: "欧洲证券及市场管理局（ESMA）",
    sourceUrl:
      "https://www.esma.europa.eu/press-news/esma-news/esma-promotes-clarity-claims-impact-and-transition",
    articleUrl:
      "https://www.esma.europa.eu/press-news/esma-news/esma-promotes-clarity-claims-impact-and-transition",
    esgTopic: "合规与监管",
    recommended: true,
    recommendReason: "ESMA就影响力与转型声明统一监管预期，直接关系可持续基金披露与防漂绿。",
    bodyZh:
      "10月12日，欧洲证券及市场管理局（ESMA）发布两份可持续金融专题监管说明，分别针对影响力投资声明和气候转型声明。说明明确基金管理人在相关表述中应遵循清晰、准确与不误导的要求，包括如何界定影响力、如何描述转型路径与目标，以及需要提供的证据与披露。此举旨在统一监管预期，防范漂绿风险，提升可持续金融产品的可信度。",
    pipeline: {
      score: 77,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-esma-sustainable-finance-briefings-2026",
      heat: 0,
      tags: ["政策", "合规与监管", "欧盟"],
      fact: {
        title: "ESMA发布两份可持续金融监管说明",
        subject: "欧洲证券及市场管理局",
        action: "发布",
        object: "影响力投资与气候转型声明监管说明",
        occurredAt: "2026-10-12",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-petrochina-tarim-ethylene-2026",
    title:
      "PetroChina Tarim 1.2 million t/y ethylene and green low-carbon demonstration project starts commercial operation",
    titleZh: "中国石油塔里木120万吨/年乙烯及配套绿色低碳示范工程投入商业运营",
    summary:
      "PetroChina announced that its Tarim 1.2 million t/y ethylene and green low-carbon demonstration project in Xinjiang has started commercial operation, combining green power, CO2 capture, blue hydrogen and blue ammonia.",
    summaryZh:
      "10月15日，中国石油宣布新疆塔里木120万吨/年乙烯及配套绿色低碳示范工程全面投入商业运营。项目将绿色电力、二氧化碳捕集、蓝氢、蓝氨及化工生产相结合，采用低浓度二氧化碳捕集技术，并计划每年消纳超过10亿千瓦时光伏电力。",
    contentType: "行业",
    region: "中国",
    publishedAt: "2026-10-15T00:00:00.000Z",
    importanceLevel: "中",
    sourceName: "中国石油",
    sourceUrl: "http://www.petrochina.com.cn/",
    articleUrl: "http://www.petrochina.com.cn/",
    esgTopic: "温室气体排放",
    recommended: false,
    bodyZh:
      "10月15日，中国石油宣布新疆塔里木120万吨/年乙烯及配套绿色低碳示范工程全面投入商业运营。项目将绿色电力、二氧化碳捕集、蓝氢、蓝氨及化工生产相结合，采用低浓度二氧化碳捕集技术，并计划每年消纳超过10亿千瓦时光伏电力。该工程被视为传统石化基地向绿色低碳转型的示范项目，涉及绿电消纳、碳捕集与化工产业链耦合等环节。",
    pipeline: {
      score: 73,
      scoreThreshold: 75,
      scorePass: false,
      sourceTier: "T1_5",
      storyId: "story-petrochina-tarim-ethylene-2026",
      heat: 0,
      tags: ["行业", "温室气体排放", "中国"],
      fact: {
        title: "中国石油塔里木120万吨/年乙烯及配套绿色低碳示范工程投入商业运营",
        subject: "中国石油",
        action: "投入商业运营",
        object: "塔里木乙烯及绿色低碳示范工程",
        occurredAt: "2026-10-15",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
  {
    id: "src-un-global-biodiversity-action-report-2026",
    title: "Global Biodiversity Action Status Report",
    titleZh: "联合国发布《全球生物多样性行动状况报告》",
    summary:
      "The United Nations officially released the Global Biodiversity Action Status Report, the first systematic assessment of progress in implementing the 2022 Kunming-Montreal Global Biodiversity Framework.",
    summaryZh:
      "10月15日，联合国正式发布《全球生物多样性行动状况报告》，首次系统评估2022年《昆明—蒙特利尔全球生物多样性框架》的实施进展，梳理各国在生物多样性保护目标、政策行动与资金投入方面的差距。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-15T00:00:00.000Z",
    importanceLevel: "高",
    sourceName: "联合国",
    sourceUrl: "https://www.cbd.int/",
    articleUrl: "https://www.cbd.int/",
    esgTopic: "气候风险",
    recommended: true,
    recommendReason: "首次系统评估昆明—蒙特利尔全球生物多样性框架实施进展，是生物多样性治理的重要基准。",
    bodyZh:
      "10月15日，联合国正式发布《全球生物多样性行动状况报告》，首次系统评估2022年《昆明—蒙特利尔全球生物多样性框架》的实施进展。报告梳理各国在生物多样性保护目标、政策行动、监测能力与资金投入方面的进展与差距，并指出要实现框架设定的2030年目标，仍需加强国家战略更新、跨部门协同与融资支持。",
    pipeline: {
      score: 88,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-un-global-biodiversity-action-report-2026",
      heat: 0,
      tags: ["政策", "气候风险", "全球"],
      fact: {
        title: "联合国发布《全球生物多样性行动状况报告》",
        subject: "联合国",
        action: "发布",
        object: "《全球生物多样性行动状况报告》",
        occurredAt: "2026-10-15",
      },
      pipelineVersion: "esg-v2.0.0",
    },
  },
];

const ENHANCEMENTS: Record<string, { summaryZh: string; bodyZh: string }> = {
  "src-18ebdgn": {
    summaryZh:
      "自然相关财务披露工作组（TNFD）于10月13日更新LEAP自然风险评估指引（LEAP 2.0），将新的自然状态衡量指标纳入框架，并加强与科学碳目标（SBTi）及科学基于自然目标（SBTN）相关方法的衔接，帮助企业更系统地评估自然相关依赖、影响、风险和机遇。",
    bodyZh:
      "自然相关财务披露工作组（TNFD）于10月13日发布LEAP 2.0，对自然风险评估指引进行重大更新。新版将新的自然状态衡量指标纳入框架，并加强与科学碳目标（SBTi）及科学基于自然目标（SBTN）相关方法的衔接，帮助企业更系统地识别和评估自然相关依赖、影响、风险与机遇。更新旨在提升企业自然相关披露的一致性与可操作性。",
  },
  "src-1f94eio": {
    summaryZh:
      "10月14日，全国首批跨境绿色电力证书集中交易在广州达成，成交绿证约10万张，对应近1亿千瓦时可再生能源电量。交易采用“双代理”模式，由内地绿电绿证服务机构与香港交易所平台分别服务两地市场主体，通过广州电力交易中心完成交易，香港采购方涵盖金融、房地产、教育及公共服务机构。",
    bodyZh:
      "10月14日，全国首批跨境绿色电力证书集中交易在广州达成，成交绿证约10万张，对应近1亿千瓦时可再生能源电量。交易采用“双代理”模式，由内地绿电绿证服务机构与香港交易所平台分别服务两地市场主体，通过广州电力交易中心完成交易。香港采购方涵盖金融、房地产、教育及公共服务机构，此次交易被视为跨境绿证流通与香港绿色金融基础设施衔接的试点。",
  },
};

const contents = readPublishedContents();
let added = 0;
let enhanced = 0;
for (const item of NEW_ITEMS) {
  const index = contents.findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    contents[index] = item;
  } else {
    contents.push(item);
    added += 1;
  }
}
for (const item of contents) {
  const patch = ENHANCEMENTS[item.id];
  if (!patch) continue;
  item.summaryZh = patch.summaryZh;
  item.bodyZh = patch.bodyZh;
  enhanced += 1;
}
contents.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
writePublishedContents(contents);
process.stdout.write(`added=${added} enhanced=${enhanced} total=${contents.length}\n`);

export {};
