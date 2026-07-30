// ESG Compass — Impact Card 组件
// 根据 contentType 自动切换镜片，展示结构化的影响分析
import type { ImpactAnalysis, PolicyImpact, AcademicImpact, ExpertImpact, RatingImpact } from "@/lib/esg-data";

// ── 等级颜色 ──────────────────────────────
var levelColors: Record<string, string> = {
  "高": "bg-risk-soft text-risk border-risk/30",
  "中": "bg-warn-soft text-warn border-warn/30",
  "低": "bg-calm-soft text-calm border-calm/30",
};

var timelineColors: Record<string, string> = {
  "已生效": "bg-calm-soft text-calm",
  "即将生效": "bg-warn-soft text-warn",
  "待观察": "bg-paper text-ink-faint",
};

var positionColors: Record<string, string> = {
  "主流共识": "bg-calm-soft text-calm",
  "争议观点": "bg-warn-soft text-warn",
  "前瞻判断": "bg-info-soft text-info",
};

// ── 子组件：评分条 ──────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[11px] text-ink-faint shrink-0">{label}</span>
      <div className="flex h-1.5 flex-1 rounded-full bg-paper overflow-hidden">
        <div className="rounded-full bg-brand transition-all" style={{ width: (value / 3) * 100 + "%" }} />
      </div>
      <span className="w-4 text-right text-[10px] font-mono text-ink-faint">{value}/3</span>
    </div>
  );
}

// ── 子组件：列表 ──────────────────────────
function BulletList({ items, label }: { items: string[]; label?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      {label && <div className="mb-1.5 text-[11px] font-medium text-ink-faint">{label}</div>}
      <ul className="space-y-0.5">
        {items.map(function (item, i) {
          return (
            <li key={i} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-soft">
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-ink-faint/40" />
              {item}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── 镜片：ESG 政策 ──────────────────────────
function PolicyCard({ data }: { data: PolicyImpact }) {
  return (
    <div className="space-y-4">
      {/* 等级 + 评分 */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <span className="text-[10px] text-ink-faint uppercase tracking-wide">影响等级</span>
          <div className="mt-1">
            <span className={"inline-block rounded-md border px-2.5 py-1 text-[13px] font-medium " + (levelColors[data.impactLevel] || "")}>
              {data.impactLevel}
            </span>
          </div>
        </div>
        <div className="flex-1 text-right">
          <span className="text-[10px] text-ink-faint uppercase tracking-wide">综合评分</span>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-ink">
            {data.impactScore}<span className="text-[14px] text-ink-faint">/9</span>
          </div>
        </div>
      </div>
      {/* 评分明细 */}
      <div className="space-y-1.5 rounded-md bg-paper px-3 py-2.5">
        <ScoreBar label="范围" value={data.scoreBreakdown.scope} />
        <ScoreBar label="力度" value={data.scoreBreakdown.magnitude} />
        <ScoreBar label="强制力" value={data.scoreBreakdown.enforceability} />
      </div>
      {/* 影响行业 */}
      <div className="flex flex-wrap gap-1.5">
        <span className="w-full text-[11px] font-medium text-ink-faint">影响行业</span>
        {data.affectedIndustries.map(function (ind) {
          return <span key={ind} className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] text-ink-soft">{ind}</span>;
        })}
      </div>
      {/* 时效 */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-ink-faint">时效</span>
        <span className={"rounded px-2 py-0.5 text-[11px] font-medium " + (timelineColors[data.timeline] || "")}>
          {data.timeline}
        </span>
        {data.effectiveDate && <span className="font-mono text-[11px] text-ink-faint">{data.effectiveDate}</span>}
      </div>
      {/* 建议动作 */}
      <BulletList items={data.actionsRequired} label="建议动作" />
      {/* 关键条款 */}
      <BulletList items={data.keyClauses} label="关键条款" />
    </div>
  );
}

// ── 镜片：学术文章 ──────────────────────────
function AcademicCard({ data }: { data: AcademicImpact }) {
  return (
    <div className="space-y-4">
      <div className="mb-1.5 text-[13px] leading-relaxed text-ink">{data.researchFinding}</div>
      <div className="flex flex-wrap gap-3">
        <div>
          <span className="text-[10px] text-ink-faint">方法可信度</span>
          <div className="mt-0.5">
            <span className={"rounded-md border px-2 py-0.5 text-[11px] font-medium " + (levelColors[data.methodologyQuality] || "")}>
              {data.methodologyQuality}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-ink-faint">信源可信度</span>
          <div className="mt-0.5">
            <span className={"rounded-md border px-2 py-0.5 text-[11px] font-medium " + (levelColors[data.sourceCredibility] || "")}>
              {data.sourceCredibility}
            </span>
          </div>
        </div>
      </div>
      <div>
        <span className="text-[11px] font-medium text-ink-faint">实践意义</span>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{data.practicalImplication}</p>
      </div>
    </div>
  );
}

// ── 镜片：专家观点 ──────────────────────────
function ExpertCard({ data }: { data: ExpertImpact }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div>
          <span className="text-[10px] text-ink-faint">信源可信度</span>
          <div className="mt-0.5">
            <span className={"rounded-md border px-2 py-0.5 text-[11px] font-medium " + (levelColors[data.sourceCredibility] || "")}>
              {data.sourceCredibility}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-ink-faint">立场</span>
          <div className="mt-0.5">
            <span className={"rounded-md border px-2 py-0.5 text-[11px] font-medium " + (positionColors[data.position] || "")}>
              {data.position}
            </span>
          </div>
        </div>
      </div>
      <div className="mb-1.5 rounded-md bg-paper px-4 py-3 border border-line">
        <span className="text-[11px] font-medium text-ink-faint">核心论点</span>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">{data.keyArgument}</p>
      </div>
    </div>
  );
}

// ── 镜片：评级动态 ──────────────────────────
function RatingCard({ data }: { data: RatingImpact }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-[10px] text-ink-faint uppercase tracking-wide">影响等级</span>
        <div className="mt-1">
          <span className={"inline-block rounded-md border px-2.5 py-1 text-[13px] font-medium " + (levelColors[data.impactLevel] || "")}>
            {data.impactLevel}
          </span>
        </div>
      </div>
      <BulletList items={data.affectedSectors} label="影响领域" />
      <BulletList items={data.actionsRequired} label="建议动作" />
    </div>
  );
}

// ── 主组件 ──────────────────────────────
interface ImpactCardProps {
  analysis: ImpactAnalysis;
}

export default function ImpactCard({ analysis }: ImpactCardProps) {
  return (
    <section className="rounded-lg border border-line bg-surface px-5 py-4">
      <div className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-ink">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-deep">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
        影响分析
      </div>
      {/* 为何必看 */}
      <div className="mb-4 text-[12px] leading-relaxed text-ink-soft bg-brand-soft/30 rounded-md px-3 py-2 border-l-2 border-brand">
        {analysis.whyThisMatters}
      </div>
      {/* 根据 contentType 渲染对应镜片 */}
      {(() => {
        if (analysis.contentType === "ESG 政策") return <PolicyCard data={analysis} />;
        if (analysis.contentType === "学术文章") return <AcademicCard data={analysis} />;
        if (analysis.contentType === "专家观点") return <ExpertCard data={analysis} />;
        if (analysis.contentType === "评级动态") return <RatingCard data={analysis} />;
        return null;
      })()}
    </section>
  );
}
