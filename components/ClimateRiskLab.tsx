"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  CloudRain,
  Factory,
  Flame,
  Info,
  Landmark,
  MapPin,
  ThermometerSun,
  Waves,
} from "lucide-react";
import world from "@svg-maps/world";

interface WorldLocation {
  id: string;
  name: string;
  path: string;
}

export interface ClimateLabEvent {
  title: string;
  href: string;
  sourceName?: string;
  publishedAt?: string;
}

type RiskKey = "rain" | "heat" | "sea" | "carbon" | "technology";
type PhysicalScenarioKey = "ssp126" | "ssp245" | "ssp585";
type TransitionScenarioKey = "netZero" | "delayed" | "currentPolicies";
type HorizonKey = "2030" | "2050";

const LOCATIONS = {
  shanghai: { name: "上海临港制造基地", caption: "沿海 · 制造业", x: 846, y: 220, icon: Factory, sensitivity: 1 },
  rotterdam: { name: "鹿特丹港区项目", caption: "沿海 · 港口物流", x: 519, y: 199, icon: Building2, sensitivity: 0.82 },
  houston: { name: "休斯敦工业园", caption: "沿海 · 能源化工", x: 272, y: 226, icon: Landmark, sensitivity: 1.16 },
} as const;

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

const EVENT_TERMS: Record<RiskKey, string[]> = {
  rain: ["暴雨", "降雨", "洪水", "内涝", "flood", "rain", "precipitation", "storm"],
  heat: ["高温", "热浪", "酷热", "heat", "heatwave", "temperature"],
  sea: ["海平面", "海岸", "沿海", "风暴潮", "sea level", "coastal", "storm surge"],
  carbon: ["碳价", "碳市场", "排放交易", "cbam", "carbon price", "carbon market", "emissions trading"],
  technology: ["技术替代", "清洁技术", "电池", "氢能", "clean technology", "battery", "hydrogen", "technology transition"],
};

function formatMetric(value: number, unit: string): string {
  if (unit === "米") return `+${value.toFixed(2)} ${unit}`;
  return `+${Math.round(value)}${unit}`;
}

export default function ClimateRiskLab({ events = [] }: { events?: ClimateLabEvent[] }) {
  const [locationKey, setLocationKey] = useState<keyof typeof LOCATIONS>("shanghai");
  const [riskKey, setRiskKey] = useState<RiskKey>("rain");
  const [physicalScenarioKey, setPhysicalScenarioKey] = useState<PhysicalScenarioKey>("ssp245");
  const [transitionScenarioKey, setTransitionScenarioKey] = useState<TransitionScenarioKey>("delayed");
  const [horizon, setHorizon] = useState<HorizonKey>("2050");
  const [showSettings, setShowSettings] = useState(false);

  const location = LOCATIONS[locationKey];
  const risk = RISKS[riskKey];
  const isTransitionRisk = riskKey === "carbon" || riskKey === "technology";
  const scenario = isTransitionRisk
    ? TRANSITION_SCENARIOS[transitionScenarioKey]
    : PHYSICAL_SCENARIOS[physicalScenarioKey];
  const horizonFactor = horizon === "2050" ? 1 : 0.58;
  const metricValue = risk.base * scenario.factor * horizonFactor * location.sensitivity;
  const low = metricValue * risk.range[0];
  const high = metricValue * risk.range[1];
  const valuation = useMemo(() => {
    const factor = scenario.factor * horizonFactor * location.sensitivity;
    const effects = risk.valuation.map((item) => ({ ...item, adjusted: item.value * factor }));
    const total = effects.reduce((sum, item) => sum + item.adjusted, 100);
    return { effects, total };
  }, [risk, scenario.factor, horizonFactor, location.sensitivity]);
  const relevantEvents = useMemo(() => events.filter((event) => {
    const normalizedTitle = event.title.toLocaleLowerCase();
    return EVENT_TERMS[riskKey].some((term) => normalizedTitle.includes(term));
  }).slice(0, 2), [events, riskKey]);
  const SelectedIcon = risk.icon;

  return (
    <section aria-labelledby="climate-lab-title" className="overflow-hidden rounded-xl border border-line bg-surface">
      <header className="border-b border-line px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold tracking-wide text-brand-deep">交互原型</span>
              <span className="text-[11px] text-ink-faint">示意数据 · 不构成预测或估值结论</span>
            </div>
            <h2 id="climate-lab-title" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">一个地点，气候风险如何进入财务报表？</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">选择示范项目和风险，沿着物理世界、经营活动到会计计量的链条查看影响。</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            aria-expanded={showSettings}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {scenario.short} · {horizon}
            <ChevronDown size={14} className={`transition-transform ${showSettings ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showSettings ? (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
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
        ) : null}
      </header>

      <div className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">示范项目</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.entries(LOCATIONS) as Array<[keyof typeof LOCATIONS, (typeof LOCATIONS)[keyof typeof LOCATIONS]]>).map(([key, item]) => {
            const Icon = item.icon;
            const active = key === locationKey;
            return (
              <button key={key} type="button" onClick={() => setLocationKey(key)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${active ? "border-brand-line bg-brand-soft" : "border-line bg-paper hover:border-brand-line"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${active ? "bg-brand text-surface" : "bg-surface text-ink-faint"}`}><Icon size={16} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-ink">{item.name}</span>
                  <span className="block text-[10px] text-ink-faint">{item.caption}</span>
                </span>
              </button>
            );
          })}
        </div>
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
            <svg viewBox={world.viewBox} className="block h-auto w-full" aria-label={`${location.name}${risk.label}空间风险示意图`}>
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
              <ellipse cx={location.x} cy={location.y} rx="170" ry="120" fill="url(#risk-field)" />
              <ellipse cx={location.x} cy={location.y} rx="82" ry="58" fill="none" stroke={risk.color} strokeOpacity="0.45" strokeWidth="2" strokeDasharray="7 6" />
              <rect width="1010" height="666" fill="url(#grid)" />
              <circle cx={location.x} cy={location.y} r="14" fill="var(--color-surface)" stroke={risk.color} strokeWidth="5" />
              <circle cx={location.x} cy={location.y} r="4" fill={risk.color} />
            </svg>
            <div className="absolute left-3 top-3 rounded-md border border-line bg-surface/95 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink"><MapPin size={12} style={{ color: risk.color }} />{location.name}</div>
              <div className="mt-1 text-[9px] text-ink-faint">约25公里气候网格 · 非厂界测量</div>
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
            <h4 className="text-[12px] font-semibold text-ink">价值敏感性桥</h4>
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
            <span className="text-[11px] font-medium text-ink-soft">情景后价值指数</span>
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

          {events.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">ESG Compass 相关事件</div>
              {relevantEvents.map((event) => (
                <a key={event.href} href={event.href} className="group mb-2 flex items-start justify-between gap-3 rounded-md bg-brand-soft px-3 py-2.5 last:mb-0">
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[11px] font-medium leading-relaxed text-ink group-hover:text-brand-deep">{event.title}</span>
                    <span className="mt-1 block text-[9px] text-ink-faint">{event.sourceName}{event.publishedAt ? ` · ${event.publishedAt.slice(0, 10)}` : ""}</span>
                  </span>
                  <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-brand-deep" />
                </a>
              ))}
              {relevantEvents.length === 0 ? (
                <div className="rounded-md border border-dashed border-line px-3 py-3 text-[10px] leading-relaxed text-ink-faint">当前没有与该风险直接匹配的已发布事件。</div>
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
