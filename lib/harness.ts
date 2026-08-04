import { promises as fs, existsSync } from "fs";
import path from "path";
import crypto from "crypto";

import type { HarnessApproval, HarnessLog, HarnessTask, ApprovalActionType } from "./harness-types";
import { SANDBOX_POLICY } from "./harness-types";

const HARNESS_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "harness");
const TASKS_FILE = path.join(/* turbopackIgnore: true */ HARNESS_DIR, "tasks.json");
const LOGS_FILE = path.join(/* turbopackIgnore: true */ HARNESS_DIR, "logs.jsonl");

async function ensureHarnessDir(): Promise<void> {
  await fs.mkdir(HARNESS_DIR, { recursive: true });
}

async function loadTasks(): Promise<HarnessTask[]> {
  await ensureHarnessDir();
  try {
    if (!existsSync(TASKS_FILE)) return [];
    var raw = await fs.readFile(TASKS_FILE, "utf8");
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as HarnessTask[] : [];
  } catch {
    return [];
  }
}

async function saveTasks(tasks: HarnessTask[]): Promise<void> {
  await ensureHarnessDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

async function loadLogs(): Promise<HarnessLog[]> {
  await ensureHarnessDir();
  try {
    if (!existsSync(LOGS_FILE)) return [];
    var raw = await fs.readFile(LOGS_FILE, "utf8");
    return raw.split(/\r?\n/).filter(function (line) { return line.trim(); }).map(function (line) {
      try { return JSON.parse(line) as HarnessLog; } catch { return null; }
    }).filter(function (log): log is HarnessLog { return log !== null; });
  } catch {
    return [];
  }
}

export async function appendHarnessLog(scope: string, level: HarnessLog["level"], message: string, meta?: Record<string, unknown>): Promise<void> {
  await ensureHarnessDir();
  var log: HarnessLog = { id: crypto.randomUUID(), ts: new Date().toISOString(), scope: scope, level: level, message: message, meta: meta };
  await fs.appendFile(LOGS_FILE, JSON.stringify(log) + "\n", "utf8");
}

export async function getHarnessTasks(limit: number = 50): Promise<HarnessTask[]> {
  var tasks = await loadTasks();
  return tasks.slice(0, limit);
}

export async function getHarnessLogs(limit: number = 80): Promise<HarnessLog[]> {
  var logs = await loadLogs();
  return logs.slice(-limit).reverse();
}

export async function createHarnessTask(input: { title: string; context?: string }): Promise<HarnessTask> {
  var now = new Date().toISOString();
  var task: HarnessTask = {
    id: "task-" + crypto.randomUUID().slice(0, 8),
    title: input.title,
    status: "queued",
    context: input.context || "",
    approvals: [],
    createdAt: now,
    updatedAt: now,
  };
  var tasks = await loadTasks();
  tasks.unshift(task);
  await saveTasks(tasks);
  await appendHarnessLog("harness.task", "info", "任务已创建", { taskId: task.id, title: task.title });
  return task;
}

export async function requestHarnessApproval(taskId: string, input: { actionType: ApprovalActionType; summary: string; target?: string }): Promise<HarnessTask> {
  var tasks = await loadTasks();
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) throw new Error("任务不存在");
  var approval: HarnessApproval = {
    id: "appr-" + crypto.randomUUID().slice(0, 8),
    taskId: taskId,
    actionType: input.actionType,
    summary: input.summary,
    target: input.target,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  task.approvals.push(approval);
  task.status = "waiting_approval";
  task.updatedAt = new Date().toISOString();
  await saveTasks(tasks);
  await appendHarnessLog("harness.approval", "warn", "等待人工确认", { taskId: taskId, approvalId: approval.id, actionType: input.actionType });
  return task;
}

export async function decideHarnessApproval(taskId: string, approvalId: string, decision: "approve" | "reject"): Promise<HarnessTask> {
  var tasks = await loadTasks();
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) throw new Error("任务不存在");
  var approval = task.approvals.find(function (a) { return a.id === approvalId; });
  if (!approval) throw new Error("确认请求不存在");
  if (approval.status !== "pending") throw new Error("该确认请求已处理");
  approval.status = decision === "approve" ? "approved" : "rejected";
  approval.decidedAt = new Date().toISOString();
  task.status = decision === "approve" ? "running" : "cancelled";
  task.updatedAt = new Date().toISOString();
  await saveTasks(tasks);
  await appendHarnessLog("harness.approval", decision === "approve" ? "info" : "warn", decision === "approve" ? "人工闸门已放行" : "人工闸门已拒绝", { taskId: taskId, approvalId: approvalId, decision: decision });
  return task;
}

export async function completeHarnessTask(taskId: string, output: string): Promise<HarnessTask> {
  var tasks = await loadTasks();
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) throw new Error("任务不存在");
  task.status = "completed";
  task.output = output;
  task.updatedAt = new Date().toISOString();
  await saveTasks(tasks);
  await appendHarnessLog("harness.task", "info", "任务已完成", { taskId: taskId });
  return task;
}

export function checkToolSandbox(tool: string): { allowed: boolean; reason?: string } {
  if ((SANDBOX_POLICY.allowedTools as readonly string[]).includes(tool)) return { allowed: true };
  return { allowed: false, reason: "工具不在 Harness 沙箱白名单：" + tool };
}