"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  CloudRain,
  Factory,
  Flame,
  Info,
  MapPin,
  RotateCcw,
  ThermometerSun,
  Waves,
} from "lucide-react";
import world from "@svg-maps/world";
import { sortClimateRiskCases, type ClimateCaseSort, type ClimateRiskCase } from "@/lib/climate-risk-cases";

interface WorldLocation {
  id: string;
  name: string;
  path: string;
}

type RiskKey = "rain" | "heat" | "sea" | "carbon" | "technology";
type PhysicalScenarioKey = "ssp126" | "ssp245" | "ssp585";
type TransitionScenarioKey = "netZero" | "delayed" | "currentPolicies";
type HorizonKey = "2030" | "2050";

const DEFAULT_PROJECT = { latitude: 31.23, longitude: 121.47, radiusKm: 25 };

const PHYSICAL_SCENARIOS: Record<PhysicalScenarioKey, { label: string; short: string; factor: number }> = {
  ssp126: { label: "低排放路径", short: "SSP1-2.6", factor: 0.72 },
  ssp245: { label: "中间路径", short: "SSP2-4.5", factor: 1 },
  ssp585: { label: "高排放路径", short: "SSP5-8.5", factor: 1.38 },
};

const TRANSITION_SCENARIOS: Record<TransitionScenarioKey, { label: string; short: string; factor: number }> = {
  netZero: { label: "有序且快速转型", short: "净零 2050", factor: 1.35 },
  delayed: { label: "政策延后后急剧收紧", short: "延迟转型", factor: 1.08 },
  currentPolicies: { label: "仅延续当前政策", short: "当前政策", factor: 0.68 },
};

const RISKS: Record<RiskKey, {
  label: string;
  icon: typeof CloudRain;
  color: string;
  soft: string;
  source: string;
  base: number;
  unit: string;
  metric: string;
  range: [number, number];
  baselineInputs: Array<{ label: string; value: string; note: string }>;
  stressControls: Array<{ label: string; unit: string; min: number; max: number; step: number; weight: number }>;
  chain: string[];
  accounting: Array<{ title: string; detail: string }>;
  valuation: Array<{ label: string; value: number }>;
}> = {
  rain: {
    label: "极端降雨",
    icon: CloudRain,
    color: "var(--color-info)",
    soft: "var(--color-info-soft)",
    source: "CMIP6 多模型集合 · RX1day 指标",
    base: 14,
    unit: "%",
    metric: "最大单日降雨强度变化",
    range: [0.55, 1.48],
    baselineInputs: [
      { label: "年均降水", value: "1,160 mm", note: "示意基准期 1995–2014" },
      { label: "相对湿度", value: "72%", note: "示意年均值" },
      { label: "RX1day", value: "112 mm", note: "示意最大单日降水" },
    ],
    stressControls: [
      { label: "年均降水偏移", unit: "%", min: -20, max: 40, step: 5, weight: 0.01 },
      { label: "相对湿度偏移", unit: "百分点", min: -10, max: 15, step: 1, weight: 0.012 },
    ],
    chain: ["强降雨增强", "排水与物流承压", "停工及维修成本上升", "现金流与资产价值承压"],
    accounting: [
      { title: "公允价值", detail: "市场参与者可能调整停工损失、适应性支出与风险溢价。" },
      { title: "IAS 36 减值", detail: "现金流预测和资产使用寿命可能需要重新评估。" },
    ],
    valuation: [
      { label: "停工", value: -3.4 },
      { label: "维修", value: -1.8 },
      { label: "保险", value: -1.1 },
      { label: "适应投资", value: 1.6 },
    ],
  },
  heat: {
    label: "极端高温",
    icon: ThermometerSun,
    color: "var(--color-risk)",
    soft: "var(--color-risk-soft)",
    source: "CMIP6 多模型集合 · 高温日数",
    base: 22,
    unit: "天",
    metric: "年高温日数变化",
    range: [0.62, 1.42],
    baselineInputs: [
      { label: "年平均温度", value: "16.2°C", note: "示意基准期 1995–2014" },
      { label: "相对湿度", value: "72%", note: "示意年均值" },
      { label: "TXx", value: "38.0°C", note: "示意年最高日温" },
    ],
    stressControls: [
      { label: "温度额外偏移", unit: "°C", min: -1, max: 4, step: 0.5, weight: 0.12 },
      { label: "相对湿度偏移", unit: "百分点", min: -10, max: 15, step: 1, weight: 0.01 },
    ],
    chain: ["高温日数增加", "冷却与劳动效率下降", "能耗及运营成本上升", "利润率与估值假设变化"],
    accounting: [
      { title: "现金流假设", detail: "能源成本、产能利用率和劳动效率进入预测。" },
      { title: "资产寿命", detail: "设备老化速度可能影响使用寿命和残值。" },
    ],
    valuation: [
      { label: "能耗", value: -2.3 },
      { label: "效率", value: -2.1 },
      { label: "维护", value: -1.4 },
      { label: "冷却改造", value: 1.3 },
    ],
  },
  sea: {
    label: "海平面",
    icon: Waves,
    color: "var(--color-brand)",
    soft: "var(--color-brand-soft)",
    source: "IPCC AR6 区域海平面投影",
    base: 0.27,
    unit: "米",
    metric: "区域海平面变化",
    range: [0.72, 1.31],
    baselineInputs: [
      { label: "项目地表高程", value: "4.0 m", note: "示意资产参数" },
      { label: "区域潮差", value: "2.6 m", note: "示意历史统计" },
      { label: "防洪标准", value: "1/100 年", note: "示意工程参数" },
    ],
    stressControls: [
      { label: "海平面额外偏移", unit: "cm", min: -10, max: 50, step: 5, weight: 0.01 },
      { label: "风暴潮额外偏移", unit: "cm", min: -20, max: 80, step: 10, weight: 0.006 },
    ],
    chain: ["平均海平面上升", "风暴潮暴露增加", "防洪与保险要求提高", "残值及资本支出变化"],
    accounting: [
      { title: "公允价值", detail: "位置风险、防护能力和可保险性可能进入市场定价。" },
      { title: "残值与寿命", detail: "长期可使用性可能改变残值及折旧估计。" },
    ],
    valuation: [
      { label: "位置折价", value: -3.1 },
      { label: "保险", value: -1.9 },
      { label: "防洪投资", value: -2.2 },
      { label: "韧性提升", value: 1.8 },
    ],
  },
  carbon: {
    label: "碳价",
    icon: Flame,
    color: "var(--color-warn)",
    soft: "var(--color-warn-soft)",
    source: "NGFS 转型情景 · 示意映射",
    base: 38,
    unit: "%",
    metric: "碳成本敏感度变化",
    range: [0.7, 1.36],
    baselineInputs: [
      { label: "范围 1+2 排放", value: "18 万 tCO₂e", note: "示意年度排放" },
      { label: "有效碳成本", value: "€65/t", note: "示意基准价格" },
      { label: "免费配额覆盖", value: "60%", note: "示意政策参数" },
    ],
    stressControls: [
      { label: "碳价偏移", unit: "%", min: -30, max: 80, step: 10, weight: 0.01 },
      { label: "免费配额减少", unit: "%", min: 0, max: 60, step: 10, weight: 0.012 },
    ],
    chain: ["碳价与监管收紧", "能源和原料成本上升", "产品利润率重新分配", "现金流及高碳资产价值变化"],
    accounting: [
      { title: "公允价值", detail: "市场参与者可能纳入未来碳成本与转型资本开支。" },
      { title: "预计负债", detail: "法定义务或合同承诺可能产生计量和披露影响。" },
    ],
    valuation: [
      { label: "碳成本", value: -4.2 },
      { label: "能源", value: -2.4 },
      { label: "需求变化", value: -1.7 },
      { label: "低碳溢价", value: 2.6 },
    ],
  },
  technology: {
    label: "技术替代",
    icon: Factory,
    color: "var(--color-violet-note)",
    soft: "var(--color-violet-soft)",
    source: "NGFS / IEA 公开情景叙事 · 示意映射",
    base: 31,
    unit: "%",
    metric: "既有技术承压程度",
    range: [0.68, 1.4],
    baselineInputs: [
      { label: "既有技术资产占比", value: "70%", note: "示意资产结构" },
      { label: "剩余经济寿命", value: "12 年", note: "示意会计估计" },
      { label: "低碳产品收入占比", value: "18%", note: "示意产品结构" },
    ],
    stressControls: [
      { label: "替代技术成本下降", unit: "%", min: 0, max: 60, step: 10, weight: 0.009 },
      { label: "既有产品需求下降", unit: "%", min: 0, max: 50, step: 5, weight: 0.012 },
    ],
    chain: ["低碳技术成本下降", "既有产能竞争力减弱", "改造与替换提前", "使用寿命和残值重估"],
    accounting: [
      { title: "IAS 36 减值", detail: "技术淘汰可能压缩现金流并触发减值迹象。" },
      { title: "公允价值", detail: "市场参与者可能采用更短经济寿命和更低残值。" },
    ],
    valuation: [
      { label: "需求迁移", value: -3.2 },
      { label: "改造资本", value: -2.8 },
      { label: "残值", value: -1.5 },
      { label: "新产品", value: 2.9 },
    ],
  },
};

function formatMetric(value: number, unit: string): string {
  if (unit === "米") return `+${value.toFixed(2)} ${unit}`;
  return `+${Math.round(value)}${unit}`;
}

function projectPoint(latitude: number, longitude: number) {
  return {
    x: ((longitude + 180) / 360) * 1010,
    y: ((90 - latitude) / 180) * 666,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ClimateRiskLab({ cases = [] }: { cases?: ClimateRiskCase[] }) {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [riskKey, setRiskKey] = useState<RiskKey>("rain");
  const [physicalScenarioKey, setPhysicalScenarioKey] = useState<PhysicalScenarioKey>("ssp245");
  const [transitionScenarioKey, setTransitionScenarioKey] = useState<TransitionScenarioKey>("delayed");
  const [horizon, setHorizon] = useState<HorizonKey>("2050");
  const [showSettings, setShowSettings] = useState(false);
  const [exposure, setExposure] = useState(75);
  const [vulnerability, setVulnerability] = useState(60);
  const [protection, setProtection] = useState(25);
  const [stressAdjustments, setStressAdjustments] = useState<Record<RiskKey, [number, number]>>({
    rain: [0, 0],
    heat: [0, 0],
    sea: [0, 0],
    carbon: [0, 0],
    technology: [0, 0],
  });
  const [caseSort, setCaseSort] = useState<ClimateCaseSort>("relevance");

  const risk = RISKS[riskKey];
  const isTransitionRisk = riskKey === "carbon" || riskKey === "technology";
  const scenario = isTransitionRisk
    ? TRANSITION_SCENARIOS[transitionScenarioKey]
    : PHYSICAL_SCENARIOS[physicalScenarioKey];
  const horizonFactor = horizon === "2050" ? 1 : 0.58;
  const stressOffset = risk.stressControls.reduce(
    (sum, control, index) => sum + stressAdjustments[riskKey][index] * control.weight,
    0,
  );
  const stressFactor = clamp(1 + stressOffset, 0.35, 2.5);
  const hazardIndex = scenario.factor * horizonFactor * stressFactor;
  const operatingImpact = hazardIndex * (exposure / 100) * (vulnerability / 100) * (1 - protection / 100);
  const metricValue = risk.base * hazardIndex;
  const low = metricValue * risk.range[0];
  const high = metricValue * risk.range[1];
  const point = projectPoint(project.latitude, project.longitude);
  const fieldRadius = clamp(58 + project.radiusKm * 1.6, 66, 190);
  const valuation = useMemo(() => {
    const effects = risk.valuation.map((item) => ({ ...item, adjusted: item.value * operatingImpact }));
    const total = effects.reduce((sum, item) => sum + item.adjusted, 100);
    return { effects, total };
  }, [risk, operatingImpact]);
  const relevantCases = useMemo(() => {
    return sortClimateRiskCases(cases, riskKey, caseSort).slice(0, 4);
  }, [caseSort, cases, riskKey]);
  const SelectedIcon = risk.icon;

  function updateStress(index: number, value: number) {
    setStressAdjustments((current) => ({
      ...current,
      [riskKey]: current[riskKey].map((item, itemIndex) => (itemIndex === index ? value : item)) as [number, number],
    }));
  }

  function resetAssumptions() {
    setExposure(75);
    setVulnerability(60);
    setProtection(25);
    setStressAdjustments((current) => ({ ...current, [riskKey]: [0, 0] }));
  }

  return (
    <section aria-labelledby="climate-lab-title" className="overflow-hidden rounded-xl border border-line bg-surface">
      <header className="border-b border-line px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold tracking-wide text-brand-deep">交互原型</span>
              <span className="text-[11px] text-ink-faint">示意数据 · 不构成预测或估值结论</span>
            </div>
            <h2 id="climate-lab-title" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">一个虚拟项目，气候风险如何进入财务报表？</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">定位项目、调整可审计假设，并查看从危险度、暴露和脆弱度到会计计量的完整推导。</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            aria-expanded={showSettings}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            模型与假设 · {scenario.short} · {horizon}
            <ChevronDown size={14} className={`transition-transform ${showSettings ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showSettings ? (
          <div className="mt-4 space-y-5 border-t border-line pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{isTransitionRisk ? "NGFS 转型情景" : "物理情景"}</legend>
              <div className="flex flex-wrap gap-2">
                {isTransitionRisk
                  ? (Object.entries(TRANSITION_SCENARIOS) as Array<[TransitionScenarioKey, (typeof TRANSITION_SCENARIOS)[TransitionScenarioKey]]>).map(([key, item]) => (
                    <button key={key} type="button" onClick={() => setTransitionScenarioKey(key)}
                      className={`rounded-md border px-3 py-2 text-left transition-colors ${transitionScenarioKey === key ? "border-brand bg-brand text-surface" : "border-line bg-surface text-ink-soft hover:border-brand-line"}`}>
                      <span className="block text-[11px] font-semibold">{item.short}</span>
                      <span className="block text-[10px] opacity-75">{item.label}</span>
                    </button>
                  ))
                  : (Object.entries(PHYSICAL_SCENARIOS) as Array<[PhysicalScenarioKey, (typeof PHYSICAL_SCENARIOS)[PhysicalScenarioKey]]>).map(([key, item]) => (
                    <button key={key} type="button" onClick={() => setPhysicalScenarioKey(key)}
                      className={`rounded-md border px-3 py-2 text-left transition-colors ${physicalScenarioKey === key ? "border-brand bg-brand text-surface" : "border-line bg-surface text-ink-soft hover:border-brand-line"}`}>
                      <span className="block text-[11px] font-semibold">{item.short}</span>
                      <span className="block text-[10px] opacity-75">{item.label}</span>
                    </button>
                  ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">观察时间</legend>
              <div className="flex gap-2">
                {(["2030", "2050"] as HorizonKey[]).map((value) => (
                  <button key={value} type="button" onClick={() => setHorizon(value)}
                    className={`rounded-md border px-4 py-2 text-[12px] font-semibold transition-colors ${horizon === value ? "border-brand bg-brand text-surface" : "border-line bg-surface text-ink-soft hover:border-brand-line"}`}>
                    {value} 年
                  </button>
                ))}
              </div>
            </fieldset>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
              <fieldset>
                <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">气候压力测试假设</legend>
                <div className="space-y-3 rounded-lg border border-line bg-paper p-3">
                  {risk.stressControls.map((control, index) => (
                    <label key={control.label} className="block">
                      <span className="mb-1.5 flex items-center justify-between gap-3 text-[10px] text-ink-soft">
                        <span>{control.label}</span>
                        <strong className="font-mono text-ink">{stressAdjustments[riskKey][index] > 0 ? "+" : ""}{stressAdjustments[riskKey][index]} {control.unit}</strong>
                      </span>
                      <input type="range" min={control.min} max={control.max} step={control.step} value={stressAdjustments[riskKey][index]}
                        onChange={(event) => updateStress(index, Number(event.target.value))} className="w-full accent-[var(--color-brand)]" />
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">资产参数</legend>
                <div className="space-y-3 rounded-lg border border-line bg-paper p-3">
                  {[
                    { label: "暴露比例", value: exposure, setter: setExposure },
                    { label: "脆弱度", value: vulnerability, setter: setVulnerability },
                    { label: "防护能力", value: protection, setter: setProtection },
                  ].map((control) => (
                    <label key={control.label} className="block">
                      <span className="mb-1.5 flex items-center justify-between text-[10px] text-ink-soft"><span>{control.label}</span><strong className="font-mono text-ink">{control.value}%</strong></span>
                      <input type="range" min="0" max="100" step="5" value={control.value} onChange={(event) => control.setter(Number(event.target.value))} className="w-full accent-[var(--color-brand)]" />
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="button" onClick={resetAssumptions} className="inline-flex h-fit items-center justify-center gap-1.5 self-end rounded-md border border-line px-3 py-2 text-[10px] font-medium text-ink-soft hover:border-brand-line hover:text-brand-deep">
                <RotateCcw size={12} />重置假设
              </button>
            </div>
            <div className="rounded-lg bg-brand-soft px-3 py-3 text-[10.5px] leading-relaxed text-ink-soft">
              <strong className="text-brand-deep">透明公式：</strong> 危险度指数 = 情景因子 × 时间因子 × 压力测试偏移；经营冲击 = 危险度指数 × 暴露比例 × 脆弱度 ×（1 − 防护能力）。气候偏移是用户压力测试假设，不会改写来源数据。
            </div>
          </div>
        ) : null}
      </header>

      <div className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint"><Factory size={13} />虚拟项目定位</div>
        <div className="grid gap-3 rounded-lg border border-line bg-paper p-3 sm:grid-cols-[1fr_1fr_1.4fr]">
          <label className="block">
            <span className="mb-1 block text-[10px] text-ink-faint">纬度</span>
            <input type="number" min="-60" max="90" step="0.01" value={project.latitude}
              onChange={(event) => setProject((current) => ({ ...current, latitude: clamp(Number(event.target.value), -60, 90) }))}
              className="w-full rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-[11px] text-ink outline-none focus:border-brand" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] text-ink-faint">经度</span>
            <input type="number" min="-180" max="180" step="0.01" value={project.longitude}
              onChange={(event) => setProject((current) => ({ ...current, longitude: clamp(Number(event.target.value), -180, 180) }))}
              className="w-full rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-[11px] text-ink outline-none focus:border-brand" />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-[10px] text-ink-faint"><span>分析半径</span><strong className="font-mono text-ink">{project.radiusKm} km</strong></span>
            <input type="range" min="5" max="100" step="5" value={project.radiusKm}
              onChange={(event) => setProject((current) => ({ ...current, radiusKm: Number(event.target.value) }))}
              className="mt-2 w-full accent-[var(--color-brand)]" />
          </label>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">可直接输入坐标或点击地图移动项目点。首期使用点位加分析半径；任意厂界绘制需完成栅格相交、面积加权和数据许可后再接入。</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <div className="border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="气候风险类型">
            {(Object.entries(RISKS) as Array<[RiskKey, (typeof RISKS)[RiskKey]]>).map(([key, item]) => {
              const Icon = item.icon;
              const active = key === riskKey;
              return (
                <button key={key} type="button" role="tab" aria-selected={active} onClick={() => setRiskKey(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${active ? "border-transparent text-surface" : "border-line bg-surface text-ink-soft hover:border-brand-line"}`}
                  style={active ? { backgroundColor: item.color } : undefined}>
                  <Icon size={13} />{item.label}
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-lg border border-line bg-paper">
            <svg viewBox={world.viewBox} className="block h-auto w-full cursor-crosshair" aria-label={`虚拟项目${risk.label}空间风险示意图`}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const longitude = clamp(((event.clientX - rect.left) / rect.width) * 360 - 180, -180, 180);
                const latitude = clamp(90 - ((event.clientY - rect.top) / rect.height) * 180, -60, 90);
                setProject((current) => ({ ...current, latitude: Number(latitude.toFixed(2)), longitude: Number(longitude.toFixed(2)) }));
              }}>
              <defs>
                <radialGradient id="risk-field">
                  <stop offset="0%" stopColor={risk.color} stopOpacity="0.58" />
                  <stop offset="38%" stopColor={risk.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={risk.color} stopOpacity="0" />
                </radialGradient>
                <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--color-line-strong)" strokeOpacity="0.45" strokeWidth="0.7" />
                </pattern>
              </defs>
              <rect width="1010" height="666" fill="var(--color-paper)" />
              {(world.locations as WorldLocation[]).map((item) => (
                <path key={item.id} d={item.path} fill="var(--color-line)" stroke="var(--color-surface)" strokeWidth="0.7" />
              ))}
              <ellipse cx={point.x} cy={point.y} rx={fieldRadius} ry={fieldRadius * 0.7} fill="url(#risk-field)" />
              <ellipse cx={point.x} cy={point.y} rx={fieldRadius * 0.48} ry={fieldRadius * 0.34} fill="none" stroke={risk.color} strokeOpacity="0.45" strokeWidth="2" strokeDasharray="7 6" />
              <rect width="1010" height="666" fill="url(#grid)" />
              <circle cx={point.x} cy={point.y} r="14" fill="var(--color-surface)" stroke={risk.color} strokeWidth="5" />
              <circle cx={point.x} cy={point.y} r="4" fill={risk.color} />
            </svg>
            <div className="absolute left-3 top-3 rounded-md border border-line bg-surface/95 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink"><MapPin size={12} style={{ color: risk.color }} />虚拟项目</div>
              <div className="mt-1 font-mono text-[9px] text-ink-faint">{project.latitude.toFixed(2)}, {project.longitude.toFixed(2)} · {project.radiusKm} km</div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md border border-line bg-surface/95 px-2.5 py-1.5 text-[9px] text-ink-faint">
              <span className="h-2 w-10 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${risk.color})` }} />风险变化示意
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="text-[11px] text-ink-faint">{risk.metric}</div>
              <div className="mt-1 flex items-end gap-2">
                <strong className="text-3xl font-semibold tracking-tight text-ink">{formatMetric(metricValue, risk.unit)}</strong>
                <span className="pb-1 text-[11px] text-ink-faint">区间 {formatMetric(low, risk.unit)} — {formatMetric(high, risk.unit)}</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] font-medium text-ink-soft">{scenario.short} · {horizon}</div>
              <div className="mt-0.5 text-[9px] text-ink-faint">{risk.source}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {risk.baselineInputs.map((input) => (
              <div key={input.label} className="rounded-md border border-line bg-surface px-3 py-2.5">
                <div className="text-[9px] text-ink-faint">{input.label}</div>
                <div className="mt-1 font-mono text-[12px] font-semibold text-ink">{input.value}</div>
                <div className="mt-0.5 text-[8.5px] text-ink-faint">{input.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-brand-soft px-3 py-2.5 text-[10px]">
            <span className="text-ink-soft">危险度指数 <strong className="font-mono text-brand-deep">{hazardIndex.toFixed(2)}</strong> × 资产调整 → 经营冲击系数 <strong className="font-mono text-brand-deep">{operatingImpact.toFixed(2)}</strong></span>
            <button type="button" onClick={() => setShowSettings(true)} className="font-semibold text-brand-deep hover:underline">查看公式与参数</button>
          </div>
        </div>

        <aside className="p-4 sm:p-6" aria-live="polite">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: risk.soft, color: risk.color }}><SelectedIcon size={20} /></span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">从风险到报表</div>
              <h3 className="mt-1 text-[17px] font-semibold text-ink">{risk.label}的影响传导</h3>
            </div>
          </div>

          <ol className="space-y-2">
            {risk.chain.map((step, index) => (
              <li key={step} className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-paper font-mono text-[9px] text-ink-faint">{index + 1}</span>
                <span className="flex-1 text-[12px] font-medium text-ink-soft">{step}</span>
                {index < risk.chain.length - 1 ? <ArrowRight size={12} className="text-ink-faint" /> : null}
              </li>
            ))}
          </ol>

          <div className="my-5 border-t border-line" />

          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-[12px] font-semibold text-ink">价值敏感性桥（示意）</h4>
            <span className="text-[9px] text-ink-faint">基准价值指数 = 100</span>
          </div>
          <div className="space-y-2">
            {valuation.effects.map((item) => (
              <div key={item.label} className="grid grid-cols-[62px_1fr_42px] items-center gap-2 text-[10px]">
                <span className="text-ink-faint">{item.label}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-line">
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(item.adjusted) * 14)}%`, backgroundColor: item.adjusted >= 0 ? "var(--color-calm)" : risk.color }} />
                </span>
                <span className={`text-right font-mono ${item.adjusted >= 0 ? "text-calm" : "text-risk"}`}>{item.adjusted > 0 ? "+" : ""}{item.adjusted.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between rounded-md bg-paper px-3 py-2.5">
            <span className="text-[11px] font-medium text-ink-soft">敏感性后指数（非估值）</span>
            <strong className="font-mono text-xl text-ink">{valuation.total.toFixed(1)}</strong>
          </div>

          <div className="mt-5 space-y-2">
            {risk.accounting.map((item) => (
              <div key={item.title} className="rounded-md border border-line px-3 py-2.5">
                <div className="text-[11px] font-semibold text-ink">{item.title}</div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-ink-soft">{item.detail}</p>
              </div>
            ))}
          </div>

          {cases.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">近五年企业风险案例</div>
                  <div className="mt-0.5 text-[9px] text-ink-faint">公司披露或监管申报 · 不等同于气候归因</div>
                </div>
                <div className="flex rounded-md border border-line bg-paper p-0.5" aria-label="案例排序">
                  {([['relevance', '相关性'], ['impact', '影响'], ['latest', '最新']] as Array<[ClimateCaseSort, string]>).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setCaseSort(key)}
                      className={`rounded px-2 py-1 text-[9px] transition-colors ${caseSort === key ? "bg-surface font-semibold text-brand-deep shadow-sm" : "text-ink-faint hover:text-ink-soft"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {relevantCases.map((item) => (
                <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="group mb-2 block rounded-md border border-line bg-surface px-3 py-2.5 last:mb-0 hover:border-brand-line">
                  <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="text-[9px] font-semibold text-brand-deep">{item.company} · {item.occurredAt}</span>
                    <span className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-relaxed text-ink group-hover:text-brand-deep">{item.title}</span>
                  </span>
                  <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-brand-deep" />
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-[9.5px] leading-relaxed text-ink-soft">{item.summary}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5 text-[8.5px] text-ink-faint">
                    <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{item.impactLabel}</span>
                    <span className="rounded bg-paper px-1.5 py-0.5">影响等级 {item.impactLevel}/5</span>
                    <span className="rounded bg-paper px-1.5 py-0.5">{item.evidenceLabel}</span>
                  </span>
                </a>
              ))}
              {relevantCases.length === 0 ? (
                <div className="rounded-md border border-dashed border-line px-3 py-3 text-[10px] leading-relaxed text-ink-faint">当前样本库没有与该风险直接匹配、且具备一手证据的企业案例。</div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex items-start gap-2 rounded-md bg-warn-soft px-3 py-2.5 text-[10px] leading-relaxed text-ink-soft">
            <Info size={13} className="mt-0.5 shrink-0 text-warn" />
            原型用于验证交互和解释逻辑。空间数值、价值指数与影响系数均为示意，不构成工程评估、保险定价或法定估值。
          </div>
        </aside>
      </div>
    </section>
  );
}
