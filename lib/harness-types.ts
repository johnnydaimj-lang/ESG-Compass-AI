export type HarnessTaskStatus = "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
export type ApprovalActionType = "read_private" | "write_file" | "external_call" | "command";

export interface HarnessApproval {
  id: string;
  taskId: string;
  actionType: ApprovalActionType;
  summary: string;
  target?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt?: string;
}

export interface HarnessTask {
  id: string;
  title: string;
  status: HarnessTaskStatus;
  context: string;
  output?: string;
  approvals: HarnessApproval[];
  createdAt: string;
  updatedAt: string;
}

export interface HarnessLog {
  id: string;
  ts: string;
  scope: string;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
}

export interface MemoryShard {
  key: "public_kb" | "private_kb" | "personal_memory" | "task_state";
  label: string;
  scope: "公开" | "私密";
  readOnly: boolean;
}

export const MEMORY_SHARDS: MemoryShard[] = [
  { key: "public_kb", label: "公开知识库", scope: "公开", readOnly: true },
  { key: "private_kb", label: "私密知识库", scope: "私密", readOnly: false },
  { key: "personal_memory", label: "个人偏好 / 项目上下文", scope: "私密", readOnly: false },
  { key: "task_state", label: "任务状态", scope: "私密", readOnly: false },
];

export const SANDBOX_POLICY = {
  allowedTools: ["read_private_markdown", "write_private_markdown", "search_public_kb", "search_private_kb"],
  blocked: ["network", "command", "shell", "exec"],
} as const;

export const MCP_GATEWAY_INTERFACE = {
  ready: false,
  servers: [] as string[],
  note: "MCP 网关仅保留接口，暂不连接外部 server",
} as const;

export function estimateTokens(text: string): number {
  return Math.ceil((text || "").length / 1.8);
}

export function trimContextByPriority(parts: { priority: number; content: string }[], maxTokens: number): string[] {
  var sorted = parts.slice().sort(function (a, b) { return a.priority - b.priority; });
  var used = 0;
  var out: string[] = [];
  for (var i = 0; i < sorted.length; i++) {
    var part = sorted[i];
    var tokens = estimateTokens(part.content);
    if (used + tokens > maxTokens) {
      var remaining = Math.max(maxTokens - used, 20);
      out.push(part.content.slice(0, Math.floor(remaining * 1.8)) + "\n[已按 Harness 上下文策略裁剪…]");
      break;
    }
    out.push(part.content);
    used += tokens;
  }
  return out;
}