export type ClimateCaseRisk = "rain" | "heat" | "sea" | "carbon" | "technology";

export interface ClimateRiskCase {
  id: string;
  company: string;
  title: string;
  summary: string;
  occurredAt: string;
  riskKeys: ClimateCaseRisk[];
  impactLabel: string;
  impactLevel: 1 | 2 | 3 | 4 | 5;
  relevanceScore: number;
  evidenceLabel: string;
  sourceName: string;
  href: string;
}

export type ClimateCaseSort = "relevance" | "impact" | "latest";

export function sortClimateRiskCases(
  cases: ClimateRiskCase[],
  riskKey: ClimateCaseRisk,
  sort: ClimateCaseSort,
): ClimateRiskCase[] {
  return cases
    .filter((item) => item.riskKeys.includes(riskKey))
    .sort((left, right) => {
      if (sort === "impact") return right.impactLevel - left.impactLevel || right.occurredAt.localeCompare(left.occurredAt);
      if (sort === "latest") return right.occurredAt.localeCompare(left.occurredAt);
      return right.relevanceScore - left.relevanceScore || right.impactLevel - left.impactLevel || right.occurredAt.localeCompare(left.occurredAt);
    });
}

// Curated prototype cases use first-party company disclosures or regulatory filings.
// Impact levels are editorial materiality bands, not cross-currency conversions.
export const CLIMATE_RISK_CASES: ClimateRiskCase[] = [
  {
    id: "hawaiian-electric-maui-wildfire-2023",
    company: "Hawaiian Electric Industries",
    title: "毛伊岛山火相关法律责任进入财务报表",
    summary: "公司就毛伊岛风暴与山火侵权索赔计提大额预计负债。案例展示灾害、基础设施责任、诉讼与持续经营判断之间的传导，但不对山火作单一气候归因。",
    occurredAt: "2023-08-08",
    riskKeys: ["heat"],
    impactLabel: "相关预计负债约 19.2 亿美元",
    impactLevel: 5,
    relevanceScore: 97,
    evidenceLabel: "公司 10-K 量化",
    sourceName: "HEI 2024 Form 10-K / SEC",
    href: "https://www.sec.gov/Archives/edgar/data/354707/000110465925029354/tm2422591d7_ars.pdf",
  },
  {
    id: "orsted-us-offshore-impairment-2023",
    company: "Ørsted",
    title: "美国海上风电项目确认重大减值",
    summary: "供应链、利率、税收抵免与许可假设共同变化，导致多个项目减值和终止。该案例用于说明转型项目并非只有技术机会，也包含执行和估值风险。",
    occurredAt: "2023-10-31",
    riskKeys: ["technology"],
    impactLabel: "2023 年减值 268 亿丹麦克朗",
    impactLevel: 5,
    relevanceScore: 96,
    evidenceLabel: "公司年报量化",
    sourceName: "Ørsted 2023 Annual Report",
    href: "https://orsted.com/en/company-announcement-list/2024/02/annual-report-for-2023--strong-underlying-results--82041",
  },
  {
    id: "sensata-electrification-impairment-2023",
    company: "Sensata Technologies",
    title: "电气化投资重排触发商誉减值",
    summary: "公司将投资重点转向电气化，并下调原业务长期预测，确认全部相关商誉减值，体现技术路径调整如何进入现金流预测和减值测试。",
    occurredAt: "2023-10-01",
    riskKeys: ["technology"],
    impactLabel: "非现金商誉减值 3.217 亿美元",
    impactLevel: 4,
    relevanceScore: 91,
    evidenceLabel: "公司年报量化",
    sourceName: "Sensata 2023 Annual Report / SEC",
    href: "https://www.sec.gov/Archives/edgar/data/1477294/000147729424000045/p07557_sensataxx2024xv1xar.pdf",
  },
  {
    id: "ryanair-carbon-cost-2024",
    company: "Ryanair",
    title: "欧盟与英国碳市场成本进入航空运营费用",
    summary: "公司披露碳信用采购成本、套期保值和价格敏感性，直接展示碳价如何影响运营成本、衍生工具公允价值与风险管理。",
    occurredAt: "2024-03-31",
    riskKeys: ["carbon"],
    impactLabel: "2024 财年碳信用成本约 6.9 亿欧元",
    impactLevel: 4,
    relevanceScore: 99,
    evidenceLabel: "公司年报量化",
    sourceName: "Ryanair 2024 Annual Report / SEC",
    href: "https://www.sec.gov/Archives/edgar/data/1038683/000155837024009522/tmb-20231231xex99d1.pdf",
  },
  {
    id: "rio-tinto-ioc-wildfire-2024",
    company: "Rio Tinto",
    title: "森林火灾导致 IOC 全场停产",
    summary: "加拿大铁矿石业务因森林火灾全场停产 11 天，并调整矿山计划和维护安排，展示物理风险对产量和运营连续性的直接影响。",
    occurredAt: "2024-07-15",
    riskKeys: ["heat"],
    impactLabel: "全场停产 11 天，年度产量同比下降 2%",
    impactLevel: 3,
    relevanceScore: 95,
    evidenceLabel: "公司产量报告",
    sourceName: "Rio Tinto 2024 Production Results",
    href: "https://www.riotinto.com/en/news/releases/2025/rio-tinto-releases-fourth-quarter-production-results",
  },
  {
    id: "hci-hurricanes-2024",
    company: "HCI Group",
    title: "三场飓风显著推高保险损失",
    summary: "Milton、Helene 和 Debby 三场飓风形成可量化保险损失，展示沿海风暴、洪水暴露和承保组合如何传导至损失费用。",
    occurredAt: "2024-10-09",
    riskKeys: ["rain", "sea"],
    impactLabel: "三场飓风净损失合计约 1.277 亿美元",
    impactLevel: 4,
    relevanceScore: 96,
    evidenceLabel: "公司 10-K 量化",
    sourceName: "HCI Group 2024 Form 10-K / SEC",
    href: "https://www.sec.gov/Archives/edgar/data/1400810/000095017025029999/hci-20241231.htm",
  },
];
