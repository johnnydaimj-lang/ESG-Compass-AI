"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CloudUpload,
  ExternalLink,
  FileCheck2,
  Loader2,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";

type PublishMode = "dry_run" | "draft_only" | "auto_publish";
type DeliveryStatus =
  | "draft"
  | "review_pending"
  | "approved"
  | "synced_to_wechat_draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "needs_manual_action";

interface AuditEvent {
  at: string;
  action: string;
  actor?: string;
  detail?: string;
  contentHash?: string;
}

interface DeliveryState {
  status: DeliveryStatus;
  approvedBy?: string;
  approvedAt?: string;
  lastError?: {
    at: string;
    stage: string;
    code?: string | number;
    message: string;
    retryable: boolean;
  };
  wechat?: {
    mediaId?: string;
    publishId?: string;
    publishStatus?: string | number;
    articleUrl?: string;
    lastSyncedAt?: string;
    lastCheckedAt?: string;
    lastMessage?: string;
  };
  history: AuditEvent[];
}

interface WeeklyItem {
  issueKey: string;
  status: DeliveryStatus;
  contentHash: string;
  approvedContentHash?: string;
  approvedAt?: string;
  approvedBy?: string;
  scheduledAt: string;
  timezone: string;
  publishMode: PublishMode;
  configured: boolean;
  missingConfig: string[];
  readyToSync: boolean;
  readyToPublish: boolean;
  isDue: boolean;
  blockers: string[];
  nextAction: string;
  previewPath: string;
  delivery: DeliveryState;
}

interface WeeklyResponse {
  ok: boolean;
  at: string;
  items: WeeklyItem[];
  error?: string;
}

const STATUS_META: Record<DeliveryStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "border-line bg-paper text-ink-soft" },
  review_pending: { label: "待终审", className: "border-warn/30 bg-warn-soft text-warn" },
  approved: { label: "已审批", className: "border-info/30 bg-info-soft text-info" },
  synced_to_wechat_draft: { label: "已建草稿", className: "border-brand-line bg-brand-soft text-brand-deep" },
  scheduled: { label: "待定时发表", className: "border-brand-line bg-brand-soft text-brand-deep" },
  publishing: { label: "发表中", className: "border-info/30 bg-info-soft text-info" },
  published: { label: "已发表", className: "border-calm/30 bg-calm-soft text-calm" },
  failed: { label: "失败可重试", className: "border-risk/30 bg-risk-soft text-risk" },
  needs_manual_action: { label: "需人工处理", className: "border-risk/30 bg-risk-soft text-risk" },
};

const MODE_META: Record<PublishMode, { label: string; description: string; className: string }> = {
  dry_run: {
    label: "Dry-run",
    description: "仅校验，不调用微信",
    className: "border-warn/30 bg-warn-soft text-warn",
  },
  draft_only: {
    label: "仅建草稿",
    description: "上传微信草稿，需后台人工发表",
    className: "border-info/30 bg-info-soft text-info",
  },
  auto_publish: {
    label: "自动发表",
    description: "到点提交 freepublish，并轮询状态",
    className: "border-calm/30 bg-calm-soft text-calm",
  },
};

function formatChinaTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function shortHash(value?: string): string {
  if (!value) return "—";
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function statusMeta(status: DeliveryStatus) {
  return STATUS_META[status] || {
    label: status,
    className: "border-line bg-paper text-ink-soft",
  };
}

export default function WechatOpsPage() {
  const [items, setItems] = useState<WeeklyItem[]>([]);
  const [loadedAt, setLoadedAt] = useState<string>("");
  const [reviewer, setReviewer] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("wechat-reviewer");
    if (saved) setReviewer(saved);
  }, []);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await fetch("/api/wechat/weekly", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as WeeklyResponse;
      if (response.status === 401) {
        throw new Error("登录已失效，请重新登录后再操作");
      }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `读取发布队列失败（HTTP ${response.status}）`);
      }
      setItems(data.items || []);
      setLoadedAt(data.at || new Date().toISOString());
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "读取发布队列失败",
      });
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateReviewer(value: string) {
    setReviewer(value);
    window.localStorage.setItem("wechat-reviewer", value);
  }

  async function runAction(
    item: WeeklyItem,
    action: "approve" | "sync-dry" | "sync-live" | "refresh" | "retry",
  ) {
    const busyKey = `${item.issueKey}:${action}`;
    setBusy(busyKey);
    setMessage(null);

    try {
      let path = "";
      let body: Record<string, unknown> | undefined;
      if (action === "approve") {
        if (reviewer.trim().length < 2) {
          throw new Error("请先填写至少 2 个字符的审核人姓名");
        }
        path = `/api/wechat/weekly/${item.issueKey}/approve`;
        body = { reviewer: reviewer.trim(), contentHash: item.contentHash };
      } else if (action === "sync-dry" || action === "sync-live") {
        path = `/api/wechat/weekly/${item.issueKey}/sync-draft`;
        body = { dryRun: action === "sync-dry" };
      } else if (action === "refresh") {
        path = `/api/wechat/weekly/${item.issueKey}/refresh-status`;
      } else {
        path = `/api/wechat/weekly/${item.issueKey}/retry`;
      }

      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || data.message || `操作失败（HTTP ${response.status}）`);
      }

      const successMessages = {
        approve: "人工终审已记录；当前内容哈希已锁定",
        "sync-dry": data.message || "Dry-run 校验通过，未调用微信接口",
        "sync-live": data.message || "微信草稿已同步",
        refresh: data.message || "微信发表状态已刷新",
        retry: "安全重试状态已准备，请按下一步操作",
      };
      setMessage({ type: "ok", text: successMessages[action] });
      await load(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "操作失败",
      });
    } finally {
      setBusy("");
    }
  }

  const reviewPending = items.filter((item) =>
    ["draft", "review_pending"].includes(item.status),
  ).length;
  const scheduled = items.filter((item) =>
    ["approved", "synced_to_wechat_draft", "scheduled"].includes(item.status),
  ).length;
  const published = items.filter((item) => item.status === "published").length;
  const needsAttention = items.filter((item) =>
    ["failed", "needs_manual_action"].includes(item.status),
  ).length;

  return (
    <div className="mx-auto max-w-6xl pb-24 md:pb-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/ops"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface"
          >
            <ArrowLeft size={12} />
            返回后台
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
            <MessageSquareText size={15} className="text-brand-deep" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-ink">公众号发布台</h1>
            <p className="text-[11px] text-ink-faint">
              审批版本 · 微信草稿 · 定时发表 · 状态审计
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading || Boolean(busy)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          刷新队列
        </button>
      </div>

      <section className="mb-5 border-y border-warn/30 bg-warn-soft px-4 py-3">
        <div className="flex items-start gap-2.5">
          <CalendarClock size={15} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-warn">微信服务器不保存本项目设定的 08:00 定时</p>
            <p className="mt-1 text-[11.5px] leading-5 text-ink-soft">
              周一 07:45 由 cron 创建草稿，08:00 由 cron 调用 freepublish/submit。
              submit 返回 publish_id 只代表提交成功，页面会继续通过 freepublish/get 核对最终状态。
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`mb-5 flex items-start gap-2 border px-4 py-3 text-[12px] ${
            message.type === "ok"
              ? "border-calm/30 bg-calm-soft text-calm"
              : "border-risk/30 bg-risk-soft text-risk"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          )}
          <span className="leading-5">{message.text}</span>
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 border border-line bg-surface sm:grid-cols-4">
        {[
          { label: "待终审", value: reviewPending, tone: "text-warn" },
          { label: "已安排", value: scheduled, tone: "text-brand-deep" },
          { label: "已发表", value: published, tone: "text-calm" },
          { label: "需处理", value: needsAttention, tone: "text-risk" },
        ].map((metric, index) => (
          <div
            key={metric.label}
            className={`px-4 py-3 ${index % 2 !== 0 ? "border-l border-line" : ""} ${
              index >= 2 ? "border-t border-line sm:border-t-0" : ""
            } ${index > 0 ? "sm:border-l sm:border-line" : ""}`}
          >
            <p className="text-[10px] text-ink-faint">{metric.label}</p>
            <p className={`mt-1 font-mono text-[22px] font-semibold tabular-nums ${metric.tone}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 border border-dashed border-line-strong bg-surface px-6 py-14 text-[13px] text-ink-faint">
          <Loader2 size={15} className="animate-spin" />
          正在读取发布队列
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-line-strong bg-surface px-6 py-14 text-center text-[13px] text-ink-faint">
          暂无可发布周报
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const status = statusMeta(item.status);
            const mode = MODE_META[item.publishMode];
            const error = item.delivery.lastError;
            const hasSameApproval = item.approvedContentHash === item.contentHash;
            const canApprove =
              item.status !== "published" &&
              item.status !== "publishing" &&
              reviewer.trim().length >= 2;
            const canSyncLive =
              item.readyToSync &&
              item.configured &&
              item.publishMode !== "dry_run" &&
              item.status !== "published";
            const canRefresh = Boolean(item.delivery.wechat?.publishId) && item.configured;
            const actionBusy = busy.startsWith(`${item.issueKey}:`);

            return (
              <article key={item.issueKey} className="border border-line bg-surface">
                <div className="border-b border-line px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-mono text-[15px] font-semibold text-ink">{item.issueKey}</h2>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${mode.className}`}>
                          {mode.label}
                        </span>
                        {!item.configured && (
                          <span className="rounded border border-warn/30 bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn">
                            微信未配置
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11.5px] text-ink-faint">
                        {mode.description} · 计划 {formatChinaTime(item.scheduledAt)}（北京时间）
                      </p>
                    </div>
                    <Link
                      href={item.previewPath}
                      target="_blank"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[11px] text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep"
                    >
                      预览全文
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>

                <div className="grid border-b border-line md:grid-cols-3">
                  <div className="min-w-0 px-4 py-3 sm:px-5">
                    <p className="text-[10px] text-ink-faint">内容审批</p>
                    <p className="mt-1 truncate text-[12px] text-ink-soft" title={item.approvedBy || "尚未审批"}>
                      {item.approvedBy || "尚未审批"}
                      {item.approvedAt ? ` · ${formatChinaTime(item.approvedAt)}` : ""}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-ink-faint" title={item.contentHash}>
                      hash {shortHash(item.contentHash)}
                    </p>
                  </div>
                  <div className="min-w-0 border-t border-line px-4 py-3 sm:px-5 md:border-l md:border-t-0">
                    <p className="text-[10px] text-ink-faint">微信任务</p>
                    <p className="mt-1 truncate font-mono text-[10.5px] text-ink-soft" title={item.delivery.wechat?.mediaId}>
                      media_id {item.delivery.wechat?.mediaId || "—"}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10.5px] text-ink-soft" title={item.delivery.wechat?.publishId}>
                      publish_id {item.delivery.wechat?.publishId || "—"}
                    </p>
                  </div>
                  <div className="min-w-0 border-t border-line px-4 py-3 sm:px-5 md:border-l md:border-t-0">
                    <p className="text-[10px] text-ink-faint">当前下一步</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-ink-soft">{item.nextAction}</p>
                    {item.delivery.wechat?.lastMessage && (
                      <p className="mt-1 line-clamp-2 text-[10.5px] text-ink-faint">
                        {item.delivery.wechat.lastMessage}
                      </p>
                    )}
                  </div>
                </div>

                {(item.blockers.length > 0 || error || item.missingConfig.length > 0) && (
                  <div className="border-b border-line px-4 py-3 sm:px-5">
                    <div className="flex items-start gap-2">
                      <CircleAlert size={13} className="mt-0.5 shrink-0 text-warn" />
                      <div className="min-w-0 space-y-1">
                        {item.blockers.map((blocker) => (
                          <p key={blocker} className="text-[11.5px] leading-5 text-ink-soft">
                            {blocker}
                          </p>
                        ))}
                        {item.missingConfig.length > 0 && (
                          <p className="break-all font-mono text-[10.5px] leading-5 text-warn">
                            缺少配置：{item.missingConfig.join(", ")}
                          </p>
                        )}
                        {error && (
                          <p className="break-words text-[11.5px] leading-5 text-risk">
                            最近错误（{error.stage}）：{error.message}
                            {error.retryable ? " · 可安全重试" : " · 需人工核对"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <label className="block min-w-0 flex-1">
                      <span className="mb-1.5 flex items-center gap-1 text-[10px] text-ink-faint">
                        <ShieldCheck size={11} />
                        终审人
                      </span>
                      <input
                        value={reviewer}
                        onChange={(event) => updateReviewer(event.target.value)}
                        placeholder="填写真实姓名后审批"
                        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[12px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand-line"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => runAction(item, "approve")}
                        disabled={actionBusy || !canApprove}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                          hasSameApproval
                            ? "border-info/30 bg-info-soft text-info"
                            : "border-brand-line bg-brand-soft text-brand-deep hover:bg-brand-line/50"
                        }`}
                      >
                        {busy === `${item.issueKey}:approve` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <FileCheck2 size={13} />
                        )}
                        {hasSameApproval ? "重新确认审批" : "人工终审通过"}
                      </button>

                      <button
                        type="button"
                        onClick={() => runAction(item, "sync-dry")}
                        disabled={actionBusy || (!item.readyToSync && item.status !== "approved")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {busy === `${item.issueKey}:sync-dry` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        Dry-run
                      </button>

                      <button
                        type="button"
                        onClick={() => runAction(item, "sync-live")}
                        disabled={actionBusy || !canSyncLive}
                        title={
                          item.publishMode === "dry_run"
                            ? "WECHAT_PUBLISH_MODE=dry_run，不能调用真实微信接口"
                            : undefined
                        }
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-[11.5px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {busy === `${item.issueKey}:sync-live` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <CloudUpload size={13} />
                        )}
                        同步微信草稿
                      </button>

                      {canRefresh && (
                        <button
                          type="button"
                          onClick={() => runAction(item, "refresh")}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-paper disabled:opacity-45"
                        >
                          {busy === `${item.issueKey}:refresh` ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RefreshCw size={13} />
                          )}
                          刷新发表状态
                        </button>
                      )}

                      {error?.retryable && (
                        <button
                          type="button"
                          onClick={() => runAction(item, "retry")}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 rounded-md border border-warn/30 bg-warn-soft px-3 py-2 text-[11.5px] font-medium text-warn transition-colors hover:bg-warn-soft/70 disabled:opacity-45"
                        >
                          {busy === `${item.issueKey}:retry` ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RotateCcw size={13} />
                          )}
                          安全重试
                        </button>
                      )}
                    </div>
                  </div>

                  <details className="mt-3 border-t border-line pt-3">
                    <summary className="cursor-pointer text-[10.5px] text-ink-faint">
                      审计记录（{item.delivery.history.length}）
                    </summary>
                    <div className="mt-2 space-y-1.5">
                      {item.delivery.history.slice(-8).reverse().map((event, index) => (
                        <div
                          key={`${event.at}-${event.action}-${index}`}
                          className="flex flex-col gap-0.5 text-[10.5px] text-ink-faint sm:flex-row sm:items-start sm:gap-2"
                        >
                          <span className="shrink-0 font-mono text-ink-soft">{formatChinaTime(event.at)}</span>
                          <span className="min-w-0 break-words">
                            {event.action}
                            {event.actor ? ` · ${event.actor}` : ""}
                            {event.detail ? ` · ${event.detail}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[10.5px] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <Clock3 size={11} />
          最近读取：{formatChinaTime(loadedAt)}
        </span>
        <span>正式上线需将文件状态与进程锁迁移到 Postgres/KV</span>
      </footer>
    </div>
  );
}
