"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, CloudRain, Flame, FlaskConical, RotateCcw } from "lucide-react";
import { SCENARIO_CATALOG, calculateCarbon, calculateOperations, type ScenarioFamily } from "@/lib/climate-lab-model";
import { sortClimateRiskCases, type ClimateCaseRisk, type ClimateCaseSort, type ClimateRiskCase } from "@/lib/climate-risk-cases";

const RISKS: Record<ClimateCaseRisk, { label: string; conditions: string; chain: string[]; accounting: string }> = {
  rain: { label: "洪水与降雨", conditions: "应读取降雨极值、洪水深度与频率，结合高程、排水和设备离地高度。年均降雨不能直接换算洪水损失。", chain: ["降雨或洪水危险", "设备、道路和供应链暴露", "停工、维修与交付延误", "现金流与减值判断"], accounting: "维修费用、存货损失及减值迹象需结合实际事实判断。公允价值考虑市场参与者对位置与适应支出的假设。" },
  heat: { label: "高温", conditions: "读取温度、湿度、风速和辐射；以户外作业人数、劳动强度和冷却设施判断热暴露。WBGT 需相应数据支持。", chain: ["高温与湿热", "员工和设备热暴露", "工时、冷却与产能变化", "运营成本与现金流"], accounting: "运营费用、产能及资产寿命假设可能变化；需要证据支持，不能由热天数直接推导固定损失比例。" },
  sea: { label: "沿海淹没", conditions: "联合相对海平面、风暴潮、潮汐与地表高程判断暴露。飓风损失不能直接证明海平面上升造成的损失。", chain: ["海平面与风暴潮", "沿海资产与防护设施", "淹没、修复与可保险性", "资本开支、残值与寿命"], accounting: "位置风险、防洪开支和长期可使用性可能影响市场参与者假设、残值和减值测试。" },
  wildfire: { label: "山火", conditions: "独立分析燃料干燥、风、植被、点火与资产距离。山火不等同于高温，也不能仅由气温推断。", chain: ["山火危险", "设施、电网与人员暴露", "停运、修复及潜在责任", "费用、预计负债与现金流"], accounting: "财产损失、诉讼和预计负债取决于具体责任与证据，不能由灾害本身推定企业法律责任。" },
  drought: { label: "干旱与缺水", conditions: "读取流域水压力、降水及土壤湿度，结合取水许可、用水量、替代水源和河运依赖。", chain: ["干旱与低水位", "取水、冷却和运输依赖", "限产、替代采购与物流成本", "利润、适应开支与现金流"], accounting: "采购及物流成本、产能利用率和资本支出进入经营预测；应区分实际成本与未来情景估计。" },
  carbon: { label: "碳成本", conditions: "输入适用履约体系内排放、有效免费配额覆盖及价格。首期不含套保、成本转嫁和间接电价传导。", chain: ["政策与碳价路径", "履约体系覆盖的排放", "净配额需求与履约成本", "利润、现金流及相关负债"], accounting: "配额、履约费用及相关金融工具依适用准则和事实处理。价格敏感性不是自动公允价值结论。" },
  technology: { label: "能源与技术转型", conditions: "按行业分析需求、能源结构、技术成本、资产剩余寿命和改造支出；融资、许可和供应链风险分别标记。", chain: ["能源与技术路径", "产品和资产结构", "需求、成本与改造节奏", "现金流、经济寿命与减值"], accounting: "结合需求与资本开支预测评估减值迹象、资产寿命和残值；综合项目减值不能全部归因于技术替代。" },
};
const PHYSICAL: ClimateCaseRisk[] = ["rain", "heat", "drought", "sea", "wildfire"];
const TRANSITION: ClimateCaseRisk[] = ["carbon", "technology"];
const DEFAULT_OPERATIONS = { downtimeDays: 10, protectedDays: 3, dailyMargin: 10, repairCost: 20, adaptationCost: 40 };
const DEFAULT_CARBON = { emissions: 10000, freeCoverage: 40, basePrice: 60, stressPrice: 90 };
const inputClass = "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-brand";
const money = (value: number) => value.toLocaleString("zh-CN", { maximumFractionDigits: 1 });

function NumberField({ label, value, onChange, max = 1e9, min = 0 }: { label: string; value: number; onChange: (value: number) => void; max?: number; min?: number }) {
  return <label className="block text-xs text-ink-soft">{label}<input type="number" min={min} max={max} step="any" value={value} onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next))); }} className={inputClass} /></label>;
}

export default function ClimateRiskLab({ cases = [] }: { cases?: ClimateRiskCase[] }) {
  const [family, setFamily] = useState<ScenarioFamily>("ipcc");
  const [selected, setSelected] = useState({ ipcc: "ssp245", iea: "steps", ngfs: "delayed" });
  const [riskKey, setRiskKey] = useState<ClimateCaseRisk>("rain");
  const [windows, setWindows] = useState({ ipcc: "2041–2060", iea: "2050", ngfs: "2050" });
  const [project, setProject] = useState({ latitude: 31.23, longitude: 121.47, workers: 100 });
  const [operations, setOperations] = useState(DEFAULT_OPERATIONS);
  const [carbon, setCarbon] = useState(DEFAULT_CARBON);
  const [sort, setSort] = useState<ClimateCaseSort>("relevance");
  const [kind, setKind] = useState("all");
  const catalog = SCENARIO_CATALOG[family];
  const scenario = catalog.scenarios.find((item) => item.id === selected[family]) ?? catalog.scenarios[0];
  const risk = RISKS[riskKey];
  const physical = family === "ipcc";
  const horizon = windows[family];
  const availableWindows = physical ? ["2021–2040", "2041–2060", "2081–2100"] : ["2030", "2050"];
  const result = calculateOperations(operations);
  const carbonResult = calculateCarbon(carbon.emissions, carbon.freeCoverage, carbon.basePrice, carbon.stressPrice);
  const matching = sortClimateRiskCases(cases, riskKey, sort).filter((item) => kind === "all" || (item.kind ?? "impact") === kind);

  function changeFamily(next: ScenarioFamily) {
    setFamily(next);
    if (next === "ipcc" && !PHYSICAL.includes(riskKey)) setRiskKey("rain");
    if (next !== "ipcc" && !TRANSITION.includes(riskKey)) setRiskKey("carbon");
  }

  return <section aria-labelledby="climate-lab-title" className="overflow-hidden rounded-xl border border-line bg-surface">
    <header className="border-b border-line p-5 sm:p-6">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deep"><FlaskConical size={15} />条件压力测试 · 研究原型</span>
      <h2 id="climate-lab-title" className="mt-2 text-xl font-semibold text-ink sm:text-2xl">气候风险如何进入财务报表？</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">选一个情景，检查项目的经营条件，再沿着影响链理解财务后果。</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <fieldset><legend className="mb-1 text-xs text-ink-faint">1 · 选择情景体系</legend><div className="flex gap-1 rounded-md bg-paper p-1">
          {(Object.keys(SCENARIO_CATALOG) as ScenarioFamily[]).map((key) => <button key={key} type="button" aria-pressed={family === key} onClick={() => changeFamily(key)} className={`flex-1 rounded px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-brand ${family === key ? "bg-brand text-surface" : "text-ink-soft hover:bg-brand-soft"}`}>{SCENARIO_CATALOG[key].name}</button>)}
        </div></fieldset>
        <label className="text-xs text-ink-faint">2 · 选择路径<select value={scenario.id} onChange={(event) => setSelected((current) => ({ ...current, [family]: event.target.value }))} className={inputClass}>{catalog.scenarios.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="text-xs text-ink-faint">3 · 观察时间{physical ? "窗" : "点"}<select value={horizon} onChange={(event) => setWindows((current) => ({ ...current, [family]: event.target.value }))} className={inputClass}>{availableWindows.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <div className="mt-4 rounded-lg bg-brand-soft p-3 text-xs leading-relaxed text-ink-soft" aria-live="polite"><strong className="text-brand-deep">{catalog.version} · {catalog.scope}：</strong>{scenario.description}<p className="mt-1">{catalog.note}</p></div>
    </header>

    <div className="grid lg:grid-cols-[1.15fr_1fr]">
      <div className="min-w-0 border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap gap-2" aria-label="选择风险">
          {(physical ? PHYSICAL : TRANSITION).map((key) => <button type="button" key={key} aria-pressed={riskKey === key} onClick={() => setRiskKey(key)} className={`rounded-full border px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-brand ${riskKey === key ? "border-brand bg-brand text-surface" : "border-line text-ink-soft hover:border-brand"}`}>{RISKS[key].label}</button>)}
        </div>
        <div className="mt-5 rounded-lg border border-dashed border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">{physical ? <CloudRain size={18} /> : <Flame size={18} />}{risk.label} · {horizon}</div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">{risk.conditions}</p>
          <p className="mt-3 text-xs font-medium text-warn">{physical ? "当地气候投影：待接入。当前坐标只定义分析对象，未生成当地危险度或空间风险图。" : "定量情景路径：待接入。以下价格与经营参数由用户设定，切换路径不会自动生成机构预测值。"}</p>
        </div>
        <details className="mt-4 rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink">项目现状与环境条件</summary>
          <div className="mt-3 grid grid-cols-2 gap-3"><NumberField label="纬度" min={-90} max={90} value={project.latitude} onChange={(value) => setProject({ ...project, latitude: value })} /><NumberField label="经度" min={-180} max={180} value={project.longitude} onChange={(value) => setProject({ ...project, longitude: value })} /></div>
          <div className="mt-3"><NumberField label="现场员工人数（人）" value={project.workers} max={1000000} onChange={(value) => setProject({ ...project, workers: value })} /></div>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">人数作为人员暴露背景记录，尚不换算伤害或货币损失。当地环境数据缺失时保持空缺。</p>
        </details>

        <h3 className="mt-6 text-sm font-semibold text-ink">{riskKey === "carbon" ? "调整碳成本假设" : "调整经营假设"}</h3>
        <p className="mt-1 text-xs text-ink-faint">默认值均为教学假设，可直接修改；所有金额使用同一货币口径。</p>
        {riskKey === "carbon" ? <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField label="履约覆盖排放（tCO₂e/年）" value={carbon.emissions} max={1e12} onChange={(value) => setCarbon({ ...carbon, emissions: value })} />
          <NumberField label="有效免费配额覆盖（%）" value={carbon.freeCoverage} max={100} onChange={(value) => setCarbon({ ...carbon, freeCoverage: value })} />
          <NumberField label="基准碳价（元/tCO₂e）" value={carbon.basePrice} max={1e6} onChange={(value) => setCarbon({ ...carbon, basePrice: value })} />
          <NumberField label="压力碳价（元/tCO₂e）" value={carbon.stressPrice} max={1e6} onChange={(value) => setCarbon({ ...carbon, stressPrice: value })} />
        </div> : <div className="mt-3 space-y-4">
          <label className="block text-xs text-ink-soft">假设停工天数：<strong>{operations.downtimeDays} 天</strong><input aria-label="假设停工天数" type="range" min="0" max="60" value={operations.downtimeDays} onChange={(event) => setOperations({ ...operations, downtimeDays: Number(event.target.value), protectedDays: Math.min(operations.protectedDays, Number(event.target.value)) })} className="mt-2 w-full accent-[var(--color-brand)]" /></label>
          <NumberField label="每日贡献毛利（万元/天）" value={operations.dailyMargin} onChange={(value) => setOperations({ ...operations, dailyMargin: value })} />
          <details><summary className="cursor-pointer text-xs font-medium text-brand-deep">比较适应措施与修复成本</summary><div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField label="假设减少停工（天）" max={operations.downtimeDays} value={operations.protectedDays} onChange={(value) => setOperations({ ...operations, protectedDays: value })} />
            <NumberField label="修复支出（万元）" value={operations.repairCost} onChange={(value) => setOperations({ ...operations, repairCost: value })} />
            <NumberField label="适应投入（万元）" value={operations.adaptationCost} onChange={(value) => setOperations({ ...operations, adaptationCost: value })} />
          </div><p className="mt-2 text-xs text-ink-faint">减少停工天数是用户假设，需实施与成效证据支持。未估计修复损失的减少。</p></details>
        </div>}
        <button type="button" onClick={() => { setOperations(DEFAULT_OPERATIONS); setCarbon(DEFAULT_CARBON); }} className="mt-4 inline-flex items-center gap-1 text-xs text-brand-deep"><RotateCcw size={12} />恢复经营假设</button>
      </div>

      <aside className="min-w-0 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink">从气候条件到财务影响</h3>
        <ol className="mt-4 space-y-2">{risk.chain.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-md bg-paper p-3 text-xs text-ink-soft"><span className="font-mono text-brand-deep">{index + 1}</span><span className="flex-1">{step}</span>{index < 3 && <ArrowRight size={13} />}</li>)}</ol>
        <div className="mt-5 rounded-lg bg-brand-soft p-4" aria-live="polite">
          <div className="text-xs text-ink-soft">{riskKey === "carbon" ? "用户价格假设下的年度增量碳成本" : "用户停工假设下的单次经营冲击"}</div>
          <strong className="mt-2 block font-mono text-3xl text-brand-deep">{money(riskKey === "carbon" ? carbonResult.delta / 10000 : result.before)}<span className="ml-1 text-xs">万元</span></strong>
          {riskKey !== "carbon" && <div className="mt-3 space-y-1 text-xs text-ink-soft"><p>措施后经营冲击：{money(result.after)} 万元</p><p>假设避免的停工损失：{money(result.avoidedInterruption)} 万元</p><p>扣除一次性适应投入后的单次差额：{money(result.firstEventBalance)} 万元</p></div>}
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">这是条件敏感性计算；没有事件概率，无法计算年均预期损失或项目公允价值。</p>
        </div>
        <details className="mt-3 rounded-lg border border-line p-3"><summary className="cursor-pointer text-xs font-semibold text-ink">查看公式、数据与计算边界</summary>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-soft">
            <p>{riskKey === "carbon" ? "增量成本 = 履约覆盖排放 × (1 − 有效免费配额覆盖比例) × (压力碳价 − 基准碳价)。" : "单次冲击 = 停工天数 × 每日贡献毛利 + 修复支出；避免的停工损失 = 减少停工天数 × 每日贡献毛利；单次差额 = 避免的停工损失 − 适应投入。"}</p>
            <p>贡献毛利表示收入扣除随产量变化的成本。首期未包含补产、套保、保险、税、折现和供应链间接效应。单次差额不等同于措施全寿命收益。</p>
            <p>情景来源：{catalog.version}；当前数值来源：用户假设；当地投影、模型区间和损失曲线：尚未接入。IPCC、IEA、NGFS 路径不建立自动一一映射。</p>
            <a href={catalog.source} target="_blank" rel="noreferrer" className="text-brand-deep underline">查看所选情景的方法依据</a>
          </div>
        </details>
        <p className="mt-4 rounded-md border border-line p-3 text-xs leading-relaxed text-ink-soft">{risk.accounting}</p>
      </aside>
    </div>

    <section className="border-t border-line p-5 sm:p-6" aria-labelledby="case-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 id="case-title" className="text-sm font-semibold text-ink">近五年企业影响与应对</h3><p className="mt-1 text-xs text-ink-faint">按事件日期滚动筛选 · 企业披露不等同于气候归因 · 当前为人工核验样本</p></div>
        <div className="flex flex-wrap gap-2"><label className="text-xs text-ink-soft">类型<select aria-label="案例类型" value={kind} onChange={(event) => setKind(event.target.value)} className={inputClass}><option value="all">全部</option><option value="impact">风险影响</option><option value="adaptation">适应与恢复</option><option value="opportunity">商业机遇</option></select></label>
        <label className="text-xs text-ink-soft">排序<select aria-label="案例排序" value={sort} onChange={(event) => setSort(event.target.value as ClimateCaseSort)} className={inputClass}><option value="relevance">相关性</option><option value="impact">影响等级</option><option value="latest">最新</option></select></label></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{matching.map((item) => <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="rounded-lg border border-line p-4 hover:border-brand">
        <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-brand-deep">{item.company} · {item.occurredAt}</span><ArrowUpRight size={14} className="shrink-0 text-brand-deep" /></div>
        <h4 className="mt-2 text-sm font-semibold text-ink">{item.title}</h4><p className="mt-2 text-xs leading-relaxed text-ink-soft">{item.summary}</p>
        <p className="mt-3 text-xs font-medium text-brand-deep">{item.impactLabel}</p><p className="mt-1 text-[10px] leading-relaxed text-ink-faint">{item.sourceName} · {item.evidenceLabel}{item.disclosedAt ? ` · 披露 ${item.disclosedAt}` : ""} · {item.status ?? "企业披露"}</p>
      </a>)}</div>
      {matching.length === 0 && <p className="mt-4 rounded-md bg-paper p-4 text-xs text-ink-faint">当前没有符合该风险和类型的已核验案例；保留空缺，等待证据。</p>}
    </section>
    <footer className="border-t border-line bg-paper p-4 text-xs leading-relaxed text-ink-faint">研究原型用于理解影响传导。数据接入与方法校准完成前，数值仅来自用户假设；不形成预测、工程评估、保险定价或法定估值。</footer>
  </section>;
}
