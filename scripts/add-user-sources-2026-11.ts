// 补录用户提供的 2026 年 10 月下旬国际 ESG 重点事件。

import type { ContentItem } from "@/lib/contracts/content";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

type Seed = {
  id: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  bodyZh: string;
  contentType: ContentItem["contentType"];
  region: string;
  publishedAt: string;
  sourceName: string;
  sourceUrl: string;
  esgTopic: string;
  score: number;
};

const SEEDS: Seed[] = [
  {
    id: "src-un-warming-15c-2026",
    title: "UN confirms global warming will exceed 1.5°C",
    titleZh: "联合国确认全球升温将超过1.5°C",
    summary: "The United Nations confirmed that global warming is set to exceed the 1.5°C goal of the Paris Agreement.",
    summaryZh:
      "联合国最新评估确认，全球平均气温升幅将超过《巴黎协定》设定的1.5°C目标，呼吁各国加快减排与适应行动。",
    bodyZh:
      "联合国最新评估确认，全球平均气温升幅将超过《巴黎协定》设定的1.5°C目标。报告指出，温室气体累积排放使升温趋势难以逆转，各国需要同时加大减排力度与气候适应投入，并加强对脆弱国家和社区的资金与技术支持。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "联合国",
    sourceUrl: "https://news.un.org/en/",
    esgTopic: "气候风险",
    score: 88,
  },
  {
    id: "src-issb-nature-framework-2026",
    title: "ISSB launches new nature-related disclosure framework",
    titleZh: "ISSB推出自然相关披露新框架",
    summary: "The ISSB released a new framework for nature-related disclosures.",
    summaryZh:
      "国际可持续发展准则理事会（ISSB）发布自然相关披露新框架，推动企业系统披露自然依赖、影响、风险与机遇。",
    bodyZh:
      "国际可持续发展准则理事会（ISSB）发布自然相关披露新框架，推动企业系统披露自然依赖、影响、风险与机遇。新框架旨在提升自然相关信息的一致性与可比性，并与现有可持续披露准则衔接，帮助投资者识别自然相关风险。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "IFRS / ISSB",
    sourceUrl: "https://www.ifrs.org/news-and-events/",
    esgTopic: "气候风险",
    score: 88,
  },
  {
    id: "src-hkex-green-stock-2026",
    title: "HKEX launches green stock recognition mechanism",
    titleZh: "港交所推出绿色股票认定机制",
    summary: "HKEX launched a green stock recognition mechanism.",
    summaryZh:
      "香港交易所推出绿色股票认定机制，为符合绿色标准的上市公司提供标识，提升绿色资本配置的透明度。",
    bodyZh:
      "香港交易所推出绿色股票认定机制，为符合绿色标准的上市公司提供标识。该机制旨在提升绿色资本配置的透明度，帮助投资者识别绿色业务占比较高的上市公司，并与香港可持续金融基础设施建设衔接。",
    contentType: "政策",
    region: "香港",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "香港交易所新闻稿",
    sourceUrl: "https://www.hkex.com.hk/News/News-Release/",
    esgTopic: "合规与监管",
    score: 80,
  },
  {
    id: "src-china-carbon-market-expansion-2026",
    title: "China accelerates expansion of national carbon market",
    titleZh: "中国碳市场交易扩容提速",
    summary: "China is accelerating the expansion of its national carbon market.",
    summaryZh:
      "中国全国碳市场交易扩容提速，覆盖行业与交易主体进一步扩大，市场流动性与价格发现功能持续增强。",
    bodyZh:
      "中国全国碳市场交易扩容提速，覆盖行业与交易主体进一步扩大。市场流动性与价格发现功能持续增强，为高排放行业提供更明确的减排信号，也为碳金融产品创新和跨市场衔接创造条件。",
    contentType: "政策",
    region: "中国",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "中国生态环境部",
    sourceUrl: "https://www.mee.gov.cn/",
    esgTopic: "温室气体排放",
    score: 82,
  },
  {
    id: "src-eu-clean-energy-finance-2026",
    title: "Europe steps up financing for clean energy transition",
    titleZh: "欧洲加码清洁能源转型融资",
    summary: "Europe is increasing financing for the clean energy transition.",
    summaryZh:
      "欧盟宣布加大清洁能源转型融资力度，支持可再生能源、电网升级与工业脱碳项目。",
    bodyZh:
      "欧盟宣布加大清洁能源转型融资力度，支持可再生能源、电网升级与工业脱碳项目。相关资金将用于降低清洁技术投资风险、提升电网灵活性，并推动能源密集型行业加快脱碳。",
    contentType: "政策",
    region: "欧盟",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "欧盟委员会",
    sourceUrl: "https://ec.europa.eu/commission/presscorner/",
    esgTopic: "气候风险",
    score: 80,
  },
  {
    id: "src-state-grid-investment-2026",
    title: "State Grid investment exceeds RMB 450 billion in first three quarters",
    titleZh: "国家电网前三季度投资超4500亿元",
    summary: "State Grid's investment exceeded RMB 450 billion in the first three quarters.",
    summaryZh:
      "国家电网公布，前三季度电网投资超过4500亿元，重点投向特高压、配电网与新能源消纳工程。",
    bodyZh:
      "国家电网公布，前三季度电网投资超过4500亿元，重点投向特高压、配电网与新能源消纳工程。投资加码旨在提升跨区域输电能力、增强电网调节灵活性，并支撑风电、光伏等新能源装机持续增长。",
    contentType: "行业",
    region: "中国",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "国家电网",
    sourceUrl: "http://www.sgcc.com.cn/",
    esgTopic: "气候风险",
    score: 72,
  },
  {
    id: "src-citi-carbon-removal-bond-2026",
    title: "Citi launches $72 million carbon removal bond",
    titleZh: "花旗推出7200万美元碳移除债券",
    summary: "Citi launched a $72 million carbon removal bond.",
    summaryZh:
      "花旗推出规模7200万美元的碳移除债券，为高质量碳移除项目提供融资，探索碳信用与债券市场的结合。",
    bodyZh:
      "花旗推出规模7200万美元的碳移除债券，为高质量碳移除项目提供融资。该产品将碳移除项目的未来收益与债券结构结合，探索碳信用与资本市场联动，为尚处早期阶段的碳移除技术提供长期资金。",
    contentType: "行业",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "花旗集团",
    sourceUrl: "https://www.citigroup.com/global/news/",
    esgTopic: "气候风险",
    score: 74,
  },
  {
    id: "src-google-vpp-1gw-2026",
    title: "Google to build 1GW virtual power plant",
    titleZh: "谷歌将建设1GW虚拟电厂",
    summary: "Google announced plans to build a 1GW virtual power plant.",
    summaryZh:
      "谷歌宣布建设1GW虚拟电厂，整合数据中心负荷、储能与可再生能源资源，提升电网灵活性与清洁电力消纳能力。",
    bodyZh:
      "谷歌宣布建设1GW虚拟电厂，整合数据中心负荷、储能与可再生能源资源。该项目通过需求响应和智能调度提升电网灵活性，缓解数据中心用电增长对局部电网的压力，并支持清洁电力消纳。",
    contentType: "行业",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "谷歌",
    sourceUrl: "https://blog.google/",
    esgTopic: "气候风险",
    score: 72,
  },
  {
    id: "src-aiib-climate-100m-2026",
    title: "AIIB invests $100 million in climate projects in the Global South",
    titleZh: "亚投行投资1亿美元支持全球南方气候项目",
    summary: "The Asian Infrastructure Investment Bank invested $100 million in climate projects in the Global South.",
    summaryZh:
      "亚洲基础设施投资银行宣布投资1亿美元，支持全球南方国家的气候适应与清洁能源项目。",
    bodyZh:
      "亚洲基础设施投资银行宣布投资1亿美元，支持全球南方国家的气候适应与清洁能源项目。资金将用于提升基础设施气候韧性、扩大可再生能源利用，并带动更多公共与私人资本参与气候项目。",
    contentType: "行业",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "亚洲基础设施投资银行（AIIB）",
    sourceUrl: "https://www.aiib.org/en/news-events/news/",
    esgTopic: "气候风险",
    score: 78,
  },
  {
    id: "src-wmo-ghg-bulletin-22-2026",
    title: "WMO Greenhouse Gas Bulletin No. 22: CO2 concentrations reach new record",
    titleZh: "世界气象组织发布第22期《温室气体公报》：全球二氧化碳浓度再创新高",
    summary: "WMO's 22nd Greenhouse Gas Bulletin reported a new record in atmospheric CO2 concentrations.",
    summaryZh:
      "世界气象组织发布第22期《温室气体公报》，全球二氧化碳浓度再创新高，温室气体累积对气候系统的影响持续加剧。",
    bodyZh:
      "世界气象组织发布第22期《温室气体公报》，全球二氧化碳浓度再创新高。公报指出，温室气体累积对气候系统的影响持续加剧，进一步强化了加快减排、保护碳汇和提升气候适应能力的紧迫性。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "世界气象组织（WMO）",
    sourceUrl: "https://wmo.int/news/",
    esgTopic: "温室气体排放",
    score: 88,
  },
  {
    id: "src-china-power-market-grec-2026",
    title: "China's power market expands; green certificate trading diverges",
    titleZh: "中国电力市场扩容，绿证交易分化",
    summary: "China's power market continued to expand in the first three quarters, with green power trading growing 6.1%.",
    summaryZh:
      "国家能源局公布，前三季度全国电力市场累计交易电量58536亿千瓦时，同比增长18.9%，其中绿电交易2492亿千瓦时，同比增长6.1%。",
    bodyZh:
      "国家能源局公布，前三季度全国电力市场累计交易电量58536亿千瓦时，同比增长18.9%，其中绿电交易2492亿千瓦时，同比增长6.1%。电力市场化交易规模持续扩大，绿电与绿证交易的增速出现分化，反映不同市场主体对绿色电力消纳和证书配置的需求差异。",
    contentType: "政策",
    region: "中国",
    publishedAt: "2026-10-27T00:00:00.000Z",
    sourceName: "国家能源局",
    sourceUrl: "https://www.nea.gov.cn/",
    esgTopic: "温室气体排放",
    score: 80,
  },
  {
    id: "src-carbon-brief-crea-clean-tech-2026",
    title: "Carbon Brief: China's clean tech exports could avoid 450 million tonnes of CO2 annually",
    titleZh: "Carbon Brief：中国清洁技术出口每年可避免约4.5亿吨二氧化碳",
    summary: "Carbon Brief published CREA analysis estimating China's clean tech exports could avoid about 450 million tonnes of CO2 per year.",
    summaryZh:
      "Carbon Brief发表CREA最新分析，预计中国2026年出口的光伏、风电、电动车及电池等技术在海外投入使用后，每年可避免约4.5亿吨二氧化碳排放，相当于中国以外全球年排放量的近2%。",
    bodyZh:
      "Carbon Brief发表能源与清洁空气研究中心（CREA）的最新分析，预计中国2026年出口的光伏、风电、电动车及电池等技术在海外投入使用后，每年可避免约4.5亿吨二氧化碳排放，相当于中国以外全球年排放量的近2%。分析认为，清洁技术贸易对全球减排的贡献被低估。",
    contentType: "观点",
    region: "全球",
    publishedAt: "2026-10-30T00:00:00.000Z",
    sourceName: "Carbon Brief",
    sourceUrl: "https://www.carbonbrief.org/",
    esgTopic: "温室气体排放",
    score: 82,
  },
  {
    id: "src-finance-biodiversity-issb-2026",
    title: "15 financial institutions call on ISSB to develop standalone nature disclosure standard",
    titleZh: "15家金融机构呼吁ISSB制定独立的自然信息披露准则",
    summary: "Finance for Biodiversity Foundation said 15 financial institutions called on the ISSB to develop a standalone nature disclosure standard.",
    summaryZh:
      "Finance for Biodiversity Foundation披露，15家金融机构联合呼吁ISSB制定独立的自然相关信息披露准则，以提升自然相关风险的透明度。",
    bodyZh:
      "Finance for Biodiversity Foundation披露，15家金融机构联合呼吁国际可持续发展准则理事会（ISSB）制定独立的自然相关信息披露准则。联署机构认为，自然相关风险需要专门披露框架，以提升信息可比性并支持投资决策。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-25T00:00:00.000Z",
    sourceName: "Finance for Biodiversity Foundation",
    sourceUrl: "https://www.financeforbiodiversity.org/",
    esgTopic: "气候风险",
    score: 78,
  },
  {
    id: "src-cop17-biodiversity-2026",
    title: "COP17 reaches agreement to accelerate nature protection",
    titleZh: "COP17达成自然保护加速协议",
    summary: "COP17 reached new arrangements to accelerate implementation of the Kunming-Montreal Global Biodiversity Framework.",
    summaryZh:
      "联合国生物多样性大会COP17在亚美尼亚埃里温经过加时谈判，就加快落实《昆明—蒙特利尔全球生物多样性框架》达成新的行动安排，包括全球进展审查与后续实施推动。",
    bodyZh:
      "联合国生物多样性大会COP17在亚美尼亚埃里温经过加时谈判，就加快落实《昆明—蒙特利尔全球生物多样性框架》达成新的行动安排。协议包括对全球进展开展审查并推动后续实施，强调国家战略更新、资金动员与跨部门协同。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-31T00:00:00.000Z",
    sourceName: "联合国生物多样性公约（CBD）",
    sourceUrl: "https://www.cbd.int/",
    esgTopic: "气候风险",
    score: 90,
  },
  {
    id: "src-gcf-46th-board-2026",
    title: "GCF approves nearly $2 billion in climate projects at 46th board meeting",
    titleZh: "绿色气候基金第46次董事会批准近20亿美元项目",
    summary: "The Green Climate Fund approved 21 projects worth about $1.97 billion at its 46th board meeting.",
    summaryZh:
      "绿色气候基金（GCF）宣布，第46次董事会会议批准21个项目，新增融资约19.7亿美元，创单次会议批准规模纪录，其中约6.82亿美元支持六项私人部门项目。",
    bodyZh:
      "绿色气候基金（GCF）宣布，第46次董事会会议批准21个项目，新增融资约19.7亿美元，创单次会议批准规模纪录。其中约6.82亿美元支持六项私人部门项目，体现GCF通过混合融资和风险分担撬动私人资本的方向。",
    contentType: "行业",
    region: "全球",
    publishedAt: "2026-10-29T00:00:00.000Z",
    sourceName: "绿色气候基金（GCF）",
    sourceUrl: "https://www.greenclimate.fund/news",
    esgTopic: "气候风险",
    score: 86,
  },
  {
    id: "src-google-finland-data-center-2026",
    title: "Finnish police investigate Google data center over environmental violations",
    titleZh: "芬兰警方调查谷歌数据中心涉嫌环境违法",
    summary: "Finnish police opened a criminal investigation into alleged environmental violations during the construction of a Google data center in Muhos.",
    summaryZh:
      "芬兰警方宣布，对谷歌子公司在北部Muhos地区建设数据中心期间涉嫌违反环境法规的行为展开刑事调查。",
    bodyZh:
      "芬兰警方宣布，对谷歌子公司在北部Muhos地区建设数据中心期间涉嫌违反环境法规的行为展开刑事调查。案件聚焦数据中心建设过程中的环境许可与合规问题，反映大型数字基础设施项目在能耗、用水和生态影响方面面临的监管审查。",
    contentType: "行业",
    region: "芬兰",
    publishedAt: "2026-10-29T00:00:00.000Z",
    sourceName: "芬兰警方",
    sourceUrl: "https://poliisi.fi/en/",
    esgTopic: "合规与监管",
    score: 74,
  },
];

const contents = readPublishedContents();
let added = 0;
for (const seed of SEEDS) {
  const existing = contents.findIndex((item) => item.id === seed.id);
  const item: ContentItem = {
    id: seed.id,
    title: seed.title,
    titleZh: seed.titleZh,
    summary: seed.summary,
    summaryZh: seed.summaryZh,
    bodyZh: seed.bodyZh,
    contentType: seed.contentType,
    region: seed.region,
    publishedAt: seed.publishedAt,
    importanceLevel: seed.score >= 85 ? "高" : seed.score >= 75 ? "中" : "低",
    sourceName: seed.sourceName,
    sourceUrl: seed.sourceUrl,
    articleUrl: seed.sourceUrl,
    esgTopic: seed.esgTopic,
    recommended: false,
    pipeline: {
      score: seed.score,
      scoreThreshold: 75,
      scorePass: false,
      sourceTier: "T1",
      storyId: `story-${seed.id}`,
      heat: 0,
      tags: [seed.contentType, seed.esgTopic, seed.region],
      fact: {
        title: seed.titleZh,
        subject: seed.sourceName,
        action: "发布",
        object: seed.titleZh,
        occurredAt: seed.publishedAt.slice(0, 10),
      },
      pipelineVersion: "esg-v2.0.0",
    },
  };
  if (existing >= 0) contents[existing] = item;
  else {
    contents.push(item);
    added += 1;
  }
}
contents.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
writePublishedContents(contents);
process.stdout.write(`added=${added} total=${contents.length}\n`);

export {};
