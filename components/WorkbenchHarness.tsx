"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Clock, FileLock2, Loader2, Plus, ShieldCheck, X } from "lucide-react";
import type { HarnessLog, HarnessTask } from "@/lib/harness-types";
import { MEMORY_SHARDS } from "@/lib/harness-types";

const STATUS_STYLE: Record<string, string> = {
  queued: "bg-paper text-ink-soft",
  running: "bg-info-soft text-info",
  waiting_approval: "bg-warn-soft text-warn",
  completed: "bg-calm-soft text-calm",
  failed: "bg-risk-soft text-risk",
  cancelled: "bg-risk-soft text-risk",
};

const ACTION_LABEL: Record<string, string> = {
  read_private: "读取私密文件",
  write_file: "写入文件",
  external_call: "外部 API 调用",
  command: "执行命令",
};

export default function WorkbenchHarness() {
  var [tasks, setTasks] = useState<HarnessTask[]>([]);
  var [logs, setLogs] = useState<HarnessLog[]>([]);
  var [title, setTitle] = useState("");
  var [context, setContext] = useState("");
  var [approvalType, setApprovalType] = useState("none");
  var [loading, setLoading] = useState(true);
  var [busy, setBusy] = useState(false);

  var refresh = useCallback(function () {
    setLoading(true);
    Promise.all([
      fetch("/api/harness/tasks", { cache: "no-store" }).then(function (r) { return r.json(); }),
      fetch("/api/harness/logs", { cache: "no-store" }).then(function (r) { return r.json(); }),
    ]).then(function (arr) {
      setTasks(arr[0].tasks || []);
      setLogs(arr[1].logs || []);
    }).catch(function () {}).finally(function () { setLoading(false); });
  }, []);

  useEffect(function () { refresh(); }, [refresh]);

  async function createTask() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      var body: any = { title: title.trim(), context: context.trim() };
      if (approvalType !== "none") {
        body.requireApproval = {
          actionType: approvalType,
          summary: ACTION_LABEL[approvalType] || "需要人工确认",
          target: approvalType === "read_private" ? "data/private-kb" : undefined,
        };
      }
      var res = await fetch("/api/harness/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setTitle("");
        setContext("");
        setApprovalType("none");
        refresh();
      }
    } catch {}
    setBusy(false);
  }

  async function decide(taskId: string, approvalId: string, decision: "approve" | "reject") {
    await fetch("/api/harness/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: taskId, approvalId: approvalId, decision: decision }),
    });
    refresh();
  }

  var waitingCount = tasks.filter(function (t) { return t.status === "waiting_approval"; }).length;
  var completedCount = tasks.filter(function (t) { return t.status === "completed"; }).length;
  var pendingApprovals = tasks.flatMap(function (t) { return t.approvals; }).filter(function (a) { return a.status === "pending"; });

  return (
    <div className="rounded-lg border border-brand-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><ShieldCheck size={14} className="text-brand-deep" />Harness 底座</h2>
          <p className="text-[11px] text-ink-faint">单 Agent · 工具沙箱 · 记忆分片 · 人工闸门 · 调用日志</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded bg-paper px-2 py-1 text-ink-soft">任务 {tasks.length}</span>
          <span className="rounded bg-warn-soft px-2 py-1 text-warn">待确认 {waitingCount}</span>
          <span className="rounded bg-calm-soft px-2 py-1 text-calm">已完成 {completedCount}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder="任务标题"
          className="rounded-md border border-line bg-paper px-3 py-2 text-[12px] text-ink outline-none placeholder:text-ink-faint" />
        <input value={context} onChange={function (e) { setContext(e.target.value); }} placeholder="任务上下文（可选）"
          className="rounded-md border border-line bg-paper px-3 py-2 text-[12px] text-ink outline-none placeholder:text-ink-faint" />
        <div className="flex gap-2">
          <select value={approvalType} onChange={function (e) { setApprovalType(e.target.value); }}
            className="flex-1 rounded-md border border-line bg-paper px-2 py-2 text-[12px] text-ink-soft outline-none">
            <option value="none">无需人工确认</option>
            <option value="read_private">读取私密文件</option>
            <option value="write_file">写入文件</option>
            <option value="external_call">外部 API 调用</option>
          </select>
          <button type="button" onClick={createTask} disabled={busy || !title.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-[12px] font-medium text-surface hover:bg-brand-deep disabled:opacity-40">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}新建
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {MEMORY_SHARDS.map(function (s) {
          return (
            <span key={s.key} className={"inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] " + (s.scope === "私密" ? "bg-violet-soft text-violet-note" : "bg-info-soft text-info")}>
              {s.readOnly ? <Clock size={9} /> : <FileLock2 size={9} />}{s.label}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
          {tasks.length === 0 && !loading && <div className="rounded border border-dashed border-line bg-paper p-4 text-center text-[11px] text-ink-faint">暂无 Harness 任务</div>}
          {tasks.map(function (task) {
            return (
              <div key={task.id} className="rounded-lg border border-line bg-paper p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12.5px] font-semibold text-ink">{task.title}</div>
                    <div className="text-[10px] text-ink-faint">{task.id} · {task.createdAt.slice(0, 16).replace("T", " ")}</div>
                  </div>
                  <span className={"shrink-0 rounded px-1.5 py-0.5 text-[10px] " + (STATUS_STYLE[task.status] || "bg-paper text-ink-soft")}>{task.status}</span>
                </div>
                {task.context && <p className="line-clamp-2 text-[11px] text-ink-soft">{task.context}</p>}
                {task.approvals.filter(function (a) { return a.status === "pending"; }).map(function (a) {
                  return (
                    <div key={a.id} className="mt-2 flex items-center justify-between gap-2 rounded-md border border-line bg-warn-soft p-2">
                      <div className="text-[11px] text-ink">{ACTION_LABEL[a.actionType] || a.actionType}：{a.summary}{a.target ? " · " + a.target : ""}</div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={function () { decide(task.id, a.id, "approve"); }} className="inline-flex items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-1 text-[10px] text-calm hover:bg-calm-soft"><Check size={10} />允许</button>
                        <button type="button" onClick={function () { decide(task.id, a.id, "reject"); }} className="inline-flex items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-1 text-[10px] text-risk hover:bg-risk-soft"><X size={10} />拒绝</button>
                      </div>
                    </div>
                  );
                })}
                {pendingApprovals.length > 0 && task.approvals.filter(function (a) { return a.status === "pending"; }).length === 0 && task.status === "running" && (
                  <div className="mt-2 text-[10px] text-calm">人工闸门已放行，任务继续执行</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="max-h-[300px] overflow-y-auto rounded-lg border border-line bg-paper p-2">
          <div className="mb-2 px-1 text-[10px] font-semibold text-ink-faint">调用日志</div>
          {logs.map(function (log) {
            return (
              <div key={log.id} className="flex items-start gap-2 border-b border-line/50 px-1 py-1.5 last:border-0">
                <span className="shrink-0 font-mono text-[9px] text-ink-faint">{log.ts.slice(11, 19)}</span>
                <span className="shrink-0 rounded bg-paper px-1 text-[9px] text-ink-soft">{log.scope}</span>
                <span className="text-[10px] leading-snug text-ink-soft">{log.message}</span>
              </div>
            );
          })}
          {logs.length === 0 && !loading && <div className="px-1 py-3 text-center text-[10px] text-ink-faint">暂无调用日志</div>}
        </div>
      </div>
    </div>
  );
}