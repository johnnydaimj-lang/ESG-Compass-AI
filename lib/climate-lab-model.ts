export type ScenarioFamily = "ipcc" | "iea" | "ngfs";
export const SCENARIO_CATALOG = {
  ipcc: {
    name: "IPCC", version: "AR6 / CMIP6", scope: "物理气候路径",
    source: "https://www.ipcc.ch/report/ar6/wg1/chapter/atlas/",
    note: "SSP 路径用于选择气候投影；当地危险度仍需地点、时间窗和模型集合数据。",
    scenarios: [
      {
        id: "ssp126", label: "SSP1-2.6", description: "低温室气体排放情景，全球二氧化碳排放在2050年后降至净零，并随后出现净负排放。",
        officialQuote: "low GHG emissions", quoteTranslation: "低温室气体排放",
        sourceUrl: "https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/",
        sourceTitle: "IPCC AR6 WGI · Technical Summary", sourceSection: "情景说明段落（检索：They start in 2015）",
        application: "用于比较低排放条件下的当地物理危险。2.6表示2100年前后的辐射强迫水平（W/m²），不是升温2.6°C；当地指标仍需实际模型数据。",
        verifiedAt: "2026-11-18",
      },
      {
        id: "ssp245", label: "SSP2-4.5", description: "中等温室气体排放情景，二氧化碳排放在本世纪中叶之前大致维持当前水平。",
        officialQuote: "intermediate GHG emissions", quoteTranslation: "中等温室气体排放",
        sourceUrl: "https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/",
        sourceTitle: "IPCC AR6 WGI · Technical Summary", sourceSection: "情景说明段落（检索：They start in 2015）",
        application: "作为中间排放路径进行对照，不代表官方预测的最可能未来。4.5是辐射强迫标识，不是升温4.5°C。",
        verifiedAt: "2026-11-18",
      },
      {
        id: "ssp585", label: "SSP5-8.5", description: "很高温室气体排放情景，二氧化碳排放约在2050年达到当前水平的两倍。",
        officialQuote: "very high GHG emissions", quoteTranslation: "很高温室气体排放",
        sourceUrl: "https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/",
        sourceTitle: "IPCC AR6 WGI · Technical Summary", sourceSection: "情景说明段落（检索：They start in 2015）",
        application: "用于高排放物理压力测试；不能称作必然或最可能未来。8.5是辐射强迫标识，不是升温8.5°C。",
        verifiedAt: "2026-11-18",
      },
    ],
  },
  iea: {
    name: "IEA", version: "WEO 2025", scope: "能源与技术转型",
    source: "https://www.iea.org/reports/world-energy-outlook-2025/overview-and-key-findings",
    note: "首期引用公开情景叙事；未导入授权的地区、行业、年份定量路径。",
    scenarios: [
      {
        id: "cps", label: "CPS 当前政策", description: "以已颁布的法律和措施为基础，分析能源体系如何演变；不假定未来政策继续加强。",
        officialQuote: "Anchored in enacted laws and measures", quoteTranslation: "以已颁布的法律和措施为基础",
        sourceUrl: "https://www.iea.org/commentaries/scenarios-in-the-world-energy-outlook-2025",
        sourceTitle: "IEA · Scenarios in the World Energy Outlook 2025", sourceSection: "The Current Policies Scenario",
        application: "用于理解现有政策、技术约束和能源需求带来的经营条件；不是能源体系保持不变，也不是预测。",
        verifiedAt: "2026-11-18",
      },
      {
        id: "steps", label: "STEPS 既定政策", description: "除现有措施外，也考虑已明确提出的政策方向，并评估市场、基础设施和融资约束；不假定所有承诺都能实现。",
        officialQuote: "A dynamic reading of today’s policy settings", quoteTranslation: "对当前政策设置的动态解读",
        sourceUrl: "https://www.iea.org/commentaries/scenarios-in-the-world-energy-outlook-2025",
        sourceTitle: "IEA · Scenarios in the World Energy Outlook 2025", sourceSection: "The Stated Policies Scenario",
        application: "用于分析能源和产品需求的政策驱动变化；不等于各国NDC或净零目标全部按时兑现。",
        verifiedAt: "2026-11-18",
      },
      {
        id: "nze", label: "NZE 净零2050", description: "围绕1.5°C目标构建全球能源转型路径。2025版包含暂时超调，并依赖减排和二氧化碳移除使升温在2100年前回落至1.5°C以下。",
        officialQuote: "global pathway for the energy sector", quoteTranslation: "面向能源部门的全球路径",
        sourceUrl: "https://www.iea.org/reports/world-energy-outlook-2025/net-zero-emissions-by-2050",
        sourceTitle: "IEA · World Energy Outlook 2025", sourceSection: "Net Zero Emissions by 2050 · Acting now to limit overshoot",
        application: "用于理解能源相关CO₂净零所需的技术、效率和投资变化；不是全程不超过1.5°C的保证，也不是企业自身净零方案。",
        verifiedAt: "2026-11-18",
      },
    ],
  },
  ngfs: {
    name: "NGFS", version: "Phase V（选用三条路径）", scope: "政策与宏观金融转型",
    source: "https://www.ngfs.net/en/publications-and-statistics/publications/ngfs-climate-scenarios-central-banks-and-supervisors-phase-v",
    note: "Phase V 中依赖 Kotz-Wenz 的部分物理损失输出受论文撤稿影响，本工具不接入这些输出。",
    scenarios: [
      {
        id: "net-zero", label: "Net Zero 2050", description: "通过严格气候政策与创新限制升温至1.5°C，并在2050年前后实现全球二氧化碳净零排放。",
        officialQuote: "stringent climate policies and innovation", quoteTranslation: "严格的气候政策与创新",
        sourceUrl: "https://www.ngfs.net/ngfs-scenarios-portal/explore/",
        sourceTitle: "NGFS · Explore long-term scenarios", sourceSection: "Net Zero 2050",
        application: "用于分析较早且协调的转型压力；与IEA NZE分属不同模型、版本和假设，不能直接互换。",
        verifiedAt: "2026-11-18",
      },
      {
        id: "delayed", label: "Delayed Transition", description: "假定全球年度排放直到2030年才开始下降，随后需要强力政策把升温限制在2°C以下，且负排放能力有限。",
        officialQuote: "global annual emissions do not decrease until 2030", quoteTranslation: "全球年度排放直到2030年才开始下降",
        sourceUrl: "https://www.ngfs.net/ngfs-scenarios-portal/explore/",
        sourceTitle: "NGFS · Explore long-term scenarios", sourceSection: "Delayed Transition",
        application: "用于考察政策后期收紧时的履约、融资和改造压力。不能把2030年直接当成单个国家或企业的政策实施日期。",
        verifiedAt: "2026-11-18",
      },
      {
        id: "current", label: "Current Policies", description: "假定仅保留当前已经实施的政策，从而形成较高物理风险的未来路径。",
        officialQuote: "only currently implemented policies are preserved", quoteTranslation: "仅保留当前已经实施的政策",
        sourceUrl: "https://www.ngfs.net/ngfs-scenarios-portal/explore/",
        sourceTitle: "NGFS · Explore long-term scenarios", sourceSection: "Current Policies",
        application: "用于检查较弱政策响应下的风险；并不意味着没有风险，也不能替代当地物理危险数据。",
        verifiedAt: "2026-11-18",
      },
    ],
  },
} as const;

export interface OperationsInput {
  downtimeDays: number;
  protectedDays: number;
  dailyMargin: number;
  repairCost: number;
  adaptationCost: number;
}

function finiteRange(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error("输入超出允许范围");
  return value;
}

// Conditional single-event arithmetic; no hazard frequency or loss probability is inferred.
export function calculateOperations(input: OperationsInput) {
  const days = finiteRange(input.downtimeDays, 0, 365);
  const protectedDays = Math.min(days, finiteRange(input.protectedDays, 0, 365));
  const margin = finiteRange(input.dailyMargin, 0, 1e9);
  const repair = finiteRange(input.repairCost, 0, 1e12);
  const capex = finiteRange(input.adaptationCost, 0, 1e12);
  const before = days * margin + repair;
  const after = (days - protectedDays) * margin + repair;
  return { before, after, avoidedInterruption: protectedDays * margin, firstEventBalance: before - after - capex };
}

export function calculateCarbon(emissions: number, freeCoverage: number, basePrice: number, stressPrice: number) {
  finiteRange(emissions, 0, 1e12);
  finiteRange(freeCoverage, 0, 100);
  finiteRange(basePrice, 0, 1e6);
  finiteRange(stressPrice, 0, 1e6);
  const coveredEmissions = emissions * (1 - freeCoverage / 100);
  return { baseCost: coveredEmissions * basePrice, stressCost: coveredEmissions * stressPrice, delta: coveredEmissions * (stressPrice - basePrice) };
}
