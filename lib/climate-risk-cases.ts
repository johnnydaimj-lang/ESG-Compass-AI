export type ClimateCaseRisk = "rain" | "heat" | "sea" | "carbon" | "technology" | "wildfire" | "drought" | "storm";

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
  disclosedAt?: string;
  kind?: "impact" | "adaptation" | "opportunity";
  status?: string;
  datePrecision?: "day" | "month" | "year";
  sourceLocator?: string;
  verifiedAt?: string;
}

export type ClimateCaseSort = "relevance" | "impact" | "latest";

export function sortClimateRiskCases(
  cases: ClimateRiskCase[],
  riskKey: ClimateCaseRisk | null,
  sort: ClimateCaseSort,
  asOf: Date = new Date(),
): ClimateRiskCase[] {
  if (!Number.isFinite(asOf.getTime())) throw new Error("Invalid as-of date");
  const cutoff = new Date(asOf);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
  const start = cutoff.toISOString().slice(0, 10);
  const end = asOf.toISOString().slice(0, 10);
  return cases
    .filter((item) => (riskKey === null || item.riskKeys.includes(riskKey)) && item.occurredAt >= start && item.occurredAt <= end)
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
      "id": "abbott-sturgis-flood-2022",
      "company": "Abbott",
      "title": "暴雨淹水使 Sturgis 特殊配方奶粉再次停产",
      "summary": "密歇根暴雨使排水系统超负荷，厂区部分进水，EleCare 生产暂停以清洁、消毒和检测；公司随后披露7月1日恢复生产。本次天气停产与此前产品召回分别记录。",
      "occurredAt": "2022-06-13",
      "disclosedAt": "2022-06-15",
      "riskKeys": [
        "rain"
      ],
      "impactLabel": "天气导致停产；7月1日恢复生产；未披露单独损失金额",
      "impactLevel": 3,
      "relevanceScore": 96,
      "evidenceLabel": "企业运营更新",
      "sourceName": "Abbott Newsroom",
      "href": "https://www.abbott.com/en-us/corpnewsroom/nutrition-health-and-wellness/abbott-update-on-powder-formula-recall",
      "sourceLocator": "June 15 / July 15, 2022 更新",
      "status": "实际停产及恢复；不归入召回损失",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "sibanye-stillwater-flood-2022",
      "company": "Sibanye-Stillwater",
      "title": "矿山本体基本无损，道路与桥梁受灾仍导致停产",
      "summary": "蒙大拿洪水损坏 Stillwater 矿周边桥梁及主要进场道路，限制人员与生产通行；采矿和冶炼设施本体基本未受影响。案例说明厂界外交通依赖同样影响业务连续性。",
      "occurredAt": "2022-06-13",
      "disclosedAt": "2022-06-24",
      "riskKeys": [
        "rain"
      ],
      "impactLabel": "当时预计停产4–6周；不是最终实际停工时长",
      "impactLevel": 3,
      "relevanceScore": 97,
      "evidenceLabel": "企业公告 / SEC",
      "sourceName": "Sibanye-Stillwater 运营更新",
      "href": "https://www.sec.gov/Archives/edgar/data/1786909/000120561322000058/sibanye_update.htm",
      "sourceLocator": "Update on the impact of regional flooding",
      "status": "2022年6月阶段性估计；最终恢复待后续核验",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "edf-heat-drought-2022",
      "company": "EDF",
      "title": "热浪与低水位限制核电生产",
      "summary": "公司披露2022年三轮热浪与严重低水位对核电生产的影响约500 GWh，未影响核安全。该数量不能与当年腐蚀检修等原因造成的总发电下降混同。",
      "occurredAt": "2022-12-31",
      "datePrecision": "year",
      "riskKeys": [
        "heat",
        "drought"
      ],
      "impactLabel": "年度核电生产影响约500 GWh，低于全年产量0.2%",
      "impactLevel": 3,
      "relevanceScore": 99,
      "evidenceLabel": "企业年度报告",
      "sourceName": "EDF 2022 Universal Registration Document",
      "href": "https://edf.publispeak.com/universal-registration-document-2022/article/176/",
      "sourceLocator": "§3.2.3.3.1，p.176",
      "status": "年度汇总；日期为报告年度归一化，非单日灾害",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "pfizer-rocky-mount-tornado-2023",
      "company": "Pfizer",
      "title": "龙卷风损坏 Rocky Mount 厂区，CDP答卷披露后续恢复",
      "summary": "2023年7月龙卷风损坏北卡罗来纳制造厂。2025年公开CDP答卷确认该厂于2024年中全面恢复运营，并说明采用厂址评估、连续性计划和结构韧性措施。",
      "occurredAt": "2023-07-19",
      "riskKeys": [
        "storm"
      ],
      "impactLabel": "厂址实际受损并恢复；CDP未来风险区间不是本次实际损失",
      "impactLevel": 3,
      "relevanceScore": 99,
      "evidenceLabel": "企业公开 CDP 答卷",
      "sourceName": "Pfizer 2025 CDP Response",
      "href": "https://cdn.pfizer.com/pfizercom/2025_CDP_Response_Pfizer_Inc.pdf",
      "sourceLocator": "PDF p.42–44，3.1.1 风险说明",
      "status": "历史影响及恢复已披露；不以答卷年份重建灾害事件",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "fraport-porto-alegre-flood-2024",
      "company": "Fraport Brasil",
      "title": "巴西洪水使 Porto Alegre 机场关闭数月",
      "summary": "暴雨洪水导致机场自5月3日起关闭，10月21日部分恢复国内航班，12月16日全面重开。记录直接运营中断与恢复，不将重建贷款或区域经济损失当作企业损失。",
      "occurredAt": "2024-05-03",
      "riskKeys": [
        "rain"
      ],
      "impactLabel": "约五个半月后部分重开；12月全面重开",
      "impactLevel": 4,
      "relevanceScore": 98,
      "evidenceLabel": "企业投资者资料",
      "sourceName": "Fraport FY2025 Aide Memoire",
      "href": "https://www.fraport.com/content/dam/fraport-company/documents/investoren/termine-und-publikationen/aide-memoire/2025/Aide%20memoire%20-%20FY2025.pdf/_jcr_content/renditions/original.media_file.download_attachment.file/Aide%20memoire%20-%20FY2025.pdf",
      "sourceLocator": "p.2，Brasil",
      "status": "实际停运与恢复；非2025年新增灾害",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "constellium-valais-flood-2024",
      "company": "Constellium",
      "title": "瑞士洪水引发停产及资产减值",
      "summary": "Valais 洪水影响 Sierre 和 Chippis 厂区。公司在2024年第二季度确认500万欧元资产减值，彼时仍在清理和评估全部影响。减值数额不等于最终全部灾害损失。",
      "occurredAt": "2024-06-30",
      "riskKeys": [
        "rain"
      ],
      "impactLabel": "已确认资产减值500万欧元；全部损失当时尚待评估",
      "impactLevel": 4,
      "relevanceScore": 99,
      "evidenceLabel": "企业证券申报",
      "sourceName": "Constellium / SEC Exhibit 99.2",
      "href": "https://www.sec.gov/Archives/edgar/data/1563411/000119312524183258/d851916dex992.htm",
      "sourceLocator": "Recent developments — flooding in Valais",
      "status": "已确认减值；完整财务影响需追踪",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "novelis-sierre-flood-2024",
      "company": "Novelis",
      "title": "Sierre 洪水影响存货、固定资产和交付成本",
      "summary": "6月30日洪水使瑞士工厂停产，9月部分重启。公司在11月业绩资料披露已确认相关费用，并另外估计保险后的现金流及调整后EBITDA影响；这些口径不可相加。",
      "occurredAt": "2024-06-30",
      "disclosedAt": "2024-11-06",
      "riskKeys": [
        "rain"
      ],
      "impactLabel": "已确认费用1.01亿美元；保险后净现金影响估计8000万美元",
      "impactLevel": 4,
      "relevanceScore": 99,
      "evidenceLabel": "企业业绩公告与演示",
      "sourceName": "Novelis / Hindalco Q2 FY2025",
      "href": "https://www.hindalco.com/upload/pdf/novelis-pressrelease-investor-presentation-q2fy25.pdf",
      "sourceLocator": "PDF p.3 / p.21，Sierre Flooding Update",
      "status": "费用实际发生；净现金影响为当时估计",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "baxter-north-cove-helene-2024",
      "company": "Baxter",
      "title": "Helene 洪水使 North Cove 输液工厂停产",
      "summary": "暴雨洪水进入厂区并损坏进场桥梁，North Cove 暂停生产。公司实施灾前撤离和产品转移，并协调监管机构及其他生产基地缓解供应中断。首份公告未量化损失。",
      "occurredAt": "2024-09-27",
      "disclosedAt": "2024-09-29",
      "riskKeys": [
        "rain",
        "storm"
      ],
      "impactLabel": "工厂实际关闭、供应受阻；首份公告未披露损失金额",
      "impactLevel": 4,
      "relevanceScore": 99,
      "evidenceLabel": "企业公告 / SEC",
      "sourceName": "Baxter September 29, 2024",
      "href": "https://www.sec.gov/Archives/edgar/data/10456/000162828024041545/bax-20240929xex991.htm",
      "sourceLocator": "North Cove facility and Hurricane Helene relief plans",
      "status": "实际影响；最终财务损失及复产待后续核验",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "duke-energy-helene-2024",
      "company": "Duke Energy",
      "title": "Helene 造成大范围停电，恢复成本包括资本开支",
      "summary": "公司披露约350万客户受到影响，并在三季报估计 Helene 恢复成本15亿至19亿美元，其中包含资本开支。恢复支出、监管资产和当期损益需分别判断，不能将全部金额称为利润损失。",
      "occurredAt": "2024-09-26",
      "riskKeys": [
        "storm",
        "rain"
      ],
      "impactLabel": "恢复成本估计15亿–19亿美元，含资本开支",
      "impactLevel": 5,
      "relevanceScore": 99,
      "evidenceLabel": "公司 10-Q 量化",
      "sourceName": "Duke Energy Q3 2024 / SEC",
      "href": "https://www.sec.gov/Archives/edgar/data/81020/000132616024000181/duk-20240930.htm",
      "sourceLocator": "Regulatory Matters — Hurricane Helene，p.49–50",
      "status": "2024年三季报阶段性估计；不混入另外两场飓风",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "helios-milton-2024",
      "company": "Helios Technologies",
      "title": "Milton 影响18个生产班次，产生清理与维修成本",
      "summary": "Sarasota 总部及液压业务受飓风影响，公司年报披露18个班次受扰、清理维修和人工成本120万美元，且未收到也不预期收到本次事件保险赔付。",
      "occurredAt": "2024-10-31",
      "datePrecision": "month",
      "riskKeys": [
        "storm"
      ],
      "impactLabel": "18个班次受影响；实际相关成本120万美元",
      "impactLevel": 3,
      "relevanceScore": 98,
      "evidenceLabel": "企业年度报告量化",
      "sourceName": "Helios 2024 Annual Report / SEC",
      "href": "https://www.sec.gov/Archives/edgar/data/1024795/000095017025057400/hlio-2025_proxy_ars.pdf",
      "sourceLocator": "PDF p.49，Hydraulics（金额单位百万美元）",
      "status": "实际成本；发生月份归一化，不以班次折算停工天数",
      "verifiedAt": "2026-11-18"
    },
    {
      "id": "sce-eaton-wildfire-2025",
      "company": "Southern California Edison",
      "title": "Eaton 山火相关责任需作会计判断",
    "summary": "公司2025年报披露 Eaton 山火和解相关损失约11亿美元，并单列预期回收及税后影响；尚有很可能发生但无法合理估计范围的额外重大损失。已确认部分与未决风险应分别披露。",
      "occurredAt": "2025-01-07",
      "riskKeys": [
        "wildfire"
      ],
    "impactLabel": "和解相关损失约11亿美元；额外损失范围尚不能合理估计",
      "impactLevel": 4,
      "relevanceScore": 98,
      "evidenceLabel": "企业年度证券申报",
    "sourceName": "Edison International / SCE 2025 Form 10-K",
    "href": "https://www.sec.gov/Archives/edgar/data/827052/000082705226000012/eix-20251231.htm",
    "sourceLocator": "Note 12，Eaton Fire，p.105–106",
      "status": "法律与会计判断；不推定最终责任金额或气候归因",
      "verifiedAt": "2026-11-18"
    },
  {
    id: "hawaiian-electric-maui-wildfire-2023",
    company: "Hawaiian Electric Industries",
    title: "毛伊岛山火相关法律责任进入财务报表",
    summary: "公司就毛伊岛风暴与山火侵权索赔计提大额预计负债。案例展示灾害、基础设施责任、诉讼与持续经营判断之间的传导，但不对山火作单一气候归因。",
    occurredAt: "2023-08-08",
    riskKeys: ["wildfire"],
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
    riskKeys: [],
    status: "多因素转型项目风险；保留记录，暂不匹配技术替代",
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
    riskKeys: ["wildfire"],
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
    riskKeys: ["storm"],
    impactLabel: "三场飓风净损失合计约 1.277 亿美元",
    impactLevel: 4,
    relevanceScore: 96,
    evidenceLabel: "公司 10-K 量化",
    sourceName: "HCI Group 2024 Form 10-K / SEC",
    href: "https://www.sec.gov/Archives/edgar/data/1400810/000095017025029999/hci-20241231.htm",
  },
  {
    id: "rio-tinto-narelle-2026",
    company: "Rio Tinto",
    title: "气旋后港口恢复运营，铁矿石发运仍受影响",
    summary: "公司披露气旋相关天气事件预计影响约800万吨发运，并识别出追回约一半影响的路径。该数量为多次天气事件合计估计；恢复计划尚不等于实际追回。",
    occurredAt: "2026-03-24",
    disclosedAt: "2026-03-30",
    riskKeys: ["storm"],
    impactLabel: "预计发运影响约800万吨；计划追回约一半",
    impactLevel: 4,
    relevanceScore: 99,
    evidenceLabel: "公司运营公告",
    sourceName: "Rio Tinto",
    href: "https://www.riotinto.com/en/news/releases/2026/rio-tinto-provides-iron-ore-update-following-tropical-cyclone-narelle",
    kind: "impact",
    status: "公司阶段性估计与恢复计划",
  },
  {
    id: "basf-low-water-vessel-2023",
    company: "BASF / Stolt Tankers",
    title: "低水位运输船投入运营，增强莱茵河物流韧性",
    summary: "公司确认低水位运输船于2023年4月底投入运营，支持低水位条件下原料运输。属于已实施适应措施，未披露可核验的避免损失金额。",
    occurredAt: "2023-04-30",
    disclosedAt: "2023-05-26",
    riskKeys: ["drought"],
    impactLabel: "已投入运营；避免损失金额未披露",
    impactLevel: 2,
    relevanceScore: 98,
    evidenceLabel: "公司联合新闻稿",
    sourceName: "BASF",
    href: "https://www.basf.com/global/en/who-we-are/organization/locations/europe/german-sites/ludwigshafen/news-and-media/news-releases/2023/05/p-23-216",
    kind: "adaptation",
    status: "运营月份已披露；日期为月末归一化，非精确启航日",
    datePrecision: "month",
  },
];
