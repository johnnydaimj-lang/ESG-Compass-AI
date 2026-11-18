export type ScenarioFamily = "ipcc" | "iea" | "ngfs";
export const SCENARIO_CATALOG = {
  ipcc: {
    name: "IPCC", version: "AR6 / CMIP6", scope: "物理气候路径",
    source: "https://www.ipcc.ch/report/ar6/wg1/chapter/atlas/",
    note: "SSP 路径用于选择气候投影；当地危险度仍需地点、时间窗和模型集合数据。",
    scenarios: [
      { id: "ssp126", label: "SSP1-2.6", description: "低排放路径；用于比较较强减排下的物理暴露。" },
      { id: "ssp245", label: "SSP2-4.5", description: "中间排放路径；按同一基准期比较当地气候指标。" },
      { id: "ssp585", label: "SSP5-8.5", description: "高排放压力路径；用于压力测试，不代表最可能未来。" },
    ],
  },
  iea: {
    name: "IEA", version: "WEO 2025", scope: "能源与技术转型",
    source: "https://www.iea.org/reports/world-energy-outlook-2025/overview-and-key-findings",
    note: "首期引用公开情景叙事；未导入授权的地区、行业、年份定量路径。",
    scenarios: [
      { id: "cps", label: "CPS 当前政策", description: "从已实施政策出发，观察能源需求、燃料结构与技术发展。" },
      { id: "steps", label: "STEPS 既定政策", description: "考虑已采用或提出的政策方向，分析能源与产品需求变化。" },
      { id: "nze", label: "NZE 净零2050", description: "目标导向的净零路径；观察能源替代与转型投资需求。" },
    ],
  },
  ngfs: {
    name: "NGFS", version: "Phase V（选用三条路径）", scope: "政策与宏观金融转型",
    source: "https://www.ngfs.net/en/publications-and-statistics/publications/ngfs-climate-scenarios-central-banks-and-supervisors-phase-v",
    note: "Phase V 中依赖 Kotz-Wenz 的部分物理损失输出受论文撤稿影响，本工具不接入这些输出。",
    scenarios: [
      { id: "net-zero", label: "Net Zero 2050", description: "较早、协调的政策转型；关注碳成本、资本开支与需求结构。" },
      { id: "delayed", label: "Delayed Transition", description: "转型推迟后收紧；关注改造节奏、履约成本与资产寿命。" },
      { id: "current", label: "Current Policies", description: "延续当前政策；关注长期物理风险及转型准备不足。" },
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
