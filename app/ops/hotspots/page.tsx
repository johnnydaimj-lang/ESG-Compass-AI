import Link from "next/link";
import { ArrowLeft, Flame, Users, Newspaper, Clock, type LucideIcon } from "lucide-react";
import { readHotspots, readPipelineStatus } from "@/lib/publication-store";
import type { StoryCluster } from "@/lib/contracts/pipeline";

function heatLevel(heat: number): { label: string; className: string } {
  if (heat >= 6) return { label: "高", className: "border-risk/30 bg-risk-soft text-risk" };
  if (heat >= 3) return { label: "中", className: "border-warn/30 bg-warn-soft text-warn" };
  return { label: "低", className: "border-line bg-paper text-ink-soft" };
}

export default function HotspotsPage() {
  const hotspots: StoryCluster[] = readHotspots();
  const status = readPipelineStatus();

  const participants = new Set<string>();
  const materials = new Set<string>();
  let latest = "";
  for (const story of hotspots) {
    for (const sourceId of story.participants) participants.add(sourceId);
    for (const memberId of story.memberIds) materials.add(memberId);
    if (story.latestPublishedAt > latest) latest = story.latestPublishedAt;
  }

  const cards: { label: string; value: string | number; icon: LucideIcon; color: string }[] = [
    { label: "热点故事", value: hotspots.length, icon: Flame, color: "text-risk" },
    { label: "参与信源", value: participants.size, icon: Users, color: "text-info" },
    { label: "关联材料", value: materials.size, icon: Newspaper, color: "text-brand-deep" },
    { label: "最近更新", value: latest || "—", icon: Clock, color: "text-ink-soft" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">
          <ArrowLeft size={12} className="inline" />返回后台
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
          <Flame size={15} className="text-risk" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink leading-tight">热点故事</h1>
          <p className="text-[11px] text-ink-faint">
            {status?.mode ? `模式 ${status.mode} · ` : ""}更新于 {status?.finishedAt ? new Date(status.finishedAt).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-4">
            <div className={`mb-2 flex items-center gap-1.5 text-[11px] ${item.color}`}>
              <item.icon size={13} />{item.label}
            </div>
            <div className="text-2xl font-semibold tabular-nums text-ink">{item.value}</div>
          </div>
        ))}
      </div>

      {hotspots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center text-[13px] text-ink-faint">
          暂无热点数据，运行管道后自动生成
        </div>
      ) : (
        <div className="space-y-3">
          {hotspots.slice(0, 80).map((story) => {
            const level = heatLevel(story.heat);
            return (
              <div key={story.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${level.className}`}>热度 {story.heat.toFixed(1)} · {level.label}</span>
                      <span className="text-[13px] font-semibold text-ink">{story.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{story.digest}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-ink-faint">
                    <span>{story.participants.length} 信源 · {story.memberIds.length} 材料</span>
                    <span>最近 {story.latestPublishedAt}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
