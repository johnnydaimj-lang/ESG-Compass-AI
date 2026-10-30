import { getWechatConfig } from "@/lib/wechat/config";
import { WechatApiError, WechatClient } from "@/lib/wechat/client";
import { WechatDeliveryLockError, withDeliveryLock } from "@/lib/wechat/lock";
import {
  appendAudit,
  assertIssueKey,
  contentHashForIssue,
  createInitialDeliveryState,
  issueIsDue,
  listDeliveryStates,
  listWeeklyIssueKeys,
  loadWeeklyIssue,
  readDeliveryState,
  writeDeliveryState,
} from "@/lib/wechat/delivery-store";
import { renderWeeklyArticle, validateWechatArticle } from "@/lib/wechat/render-weekly";
import { redactSensitiveText } from "@/lib/wechat/sanitize";
import type {
  WeeklyDeliveryStatus,
  WechatApi,
  WechatConfig,
  WechatDeliveryResult,
  WechatDeliveryState,
  WechatIssueReadiness,
  WeeklyIssue,
} from "@/lib/wechat/types";

export class WechatServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, options: { statusCode?: number; code?: string } = {}) {
    super(message);
    this.name = "WechatServiceError";
    this.statusCode = options.statusCode || 400;
    this.code = options.code || "WECHAT_SERVICE_ERROR";
  }
}

interface ServiceOptions {
  config?: WechatConfig;
  client?: WechatApi;
  now?: () => Date;
}

interface ApproveInput {
  reviewer: string;
  contentHash: string;
}

interface ActionOptions {
  dryRun?: boolean;
}

function isConfigured(config: WechatConfig): boolean {
  return config.missing.length === 0;
}

function effectiveStatus(state: WechatDeliveryState, issue: WeeklyIssue): WeeklyDeliveryStatus {
  const currentHash = contentHashForIssue(issue);
  if (state.contentHash !== currentHash && state.status !== "published") return "review_pending";
  return state.status;
}

function messageForStatus(status: WeeklyDeliveryStatus): string {
  switch (status) {
    case "approved":
      return "内容已审批，等待同步微信草稿";
    case "synced_to_wechat_draft":
      return "已同步到微信草稿箱，等待定时发表";
    case "scheduled":
      return "已同步到微信草稿箱，等待定时发表";
    case "publishing":
      return "微信发布任务已提交，等待状态确认";
    case "published":
      return "文章已发表";
    case "needs_manual_action":
      return "需要人工检查微信后台";
    case "failed":
      return "最近一次操作失败，请检查错误并重试";
    default:
      return "内容待人工终审";
  }
}

function publishStatusKind(status: number | string): {
  state: WeeklyDeliveryStatus;
  message: string;
} {
  switch (String(status)) {
    case "0":
      return { state: "published", message: "微信发布成功" };
    case "1":
      return { state: "publishing", message: "微信正在发布" };
    case "2":
      return { state: "needs_manual_action", message: "原创校验失败，需要人工处理" };
    case "3":
      return { state: "failed", message: "微信常规发布失败" };
    case "4":
      return { state: "needs_manual_action", message: "平台审核未通过，需要人工处理" };
    case "5":
      return { state: "needs_manual_action", message: "发布任务未完成，需要人工检查" };
    default:
      return { state: "needs_manual_action", message: `未知发布状态：${String(status)}` };
  }
}

function setError(
  state: WechatDeliveryState,
  stage: "approve" | "sync" | "publish" | "status",
  error: unknown,
  retryable: boolean,
  now: string,
): WechatDeliveryState {
  const apiError = error instanceof WechatApiError ? error : null;
  const message = redactSensitiveText(error);
  return {
    ...state,
    updatedAt: now,
    lastError: {
      at: now,
      stage,
      code: apiError?.code,
      message,
      retryable,
    },
  };
}

export class WechatDeliveryService {
  private readonly config: WechatConfig;
  private readonly client: WechatApi;
  private readonly now: () => Date;

  constructor(options: ServiceOptions = {}) {
    this.config = options.config || getWechatConfig();
    this.client = options.client || new WechatClient(this.config);
    this.now = options.now || (() => new Date());
  }

  private async withIssueLock<T>(issueKey: string, operation: () => Promise<T> | T): Promise<T> {
    try {
      return await withDeliveryLock(issueKey, operation);
    } catch (error) {
      if (error instanceof WechatDeliveryLockError) {
        throw new WechatServiceError(redactSensitiveText(error), {
          statusCode: 409,
          code: error.code,
        });
      }
      throw error;
    }
  }

  getReadiness(issueKey: string): WechatIssueReadiness {
    const normalized = assertIssueKey(issueKey);
    const issue = loadWeeklyIssue(normalized);
    const state = readDeliveryState(normalized, issue);
    const currentHash = contentHashForIssue(issue);
    const status = effectiveStatus(state, issue);
    const hashMatches = state.approvedContentHash === currentHash;
    const configured = isConfigured(this.config);
    const isDryRun = this.config.publishMode === "dry_run";
    const blockers: string[] = [];

    if (status === "review_pending" || status === "draft") {
      blockers.push("内容尚未完成人工终审");
    }
    if (status === "approved" && !hashMatches) {
      blockers.push("审批记录与当前正文不一致，请重新终审");
    }
    if (["synced_to_wechat_draft", "scheduled", "publishing", "published"].includes(status) && !hashMatches) {
      blockers.push("正文在同步后发生变化，需重新终审并重新创建微信草稿");
    }
    if (!isDryRun && !configured) {
      blockers.push(`缺少微信配置：${this.config.missing.join(", ")}`);
    }

    const due = issueIsDue({ ...state, scheduledAt: issue.scheduledAt }, this.now());
    if (status === "approved" && due) {
      blockers.push("尚未同步微信草稿，不能提交发表");
    }
    if (status === "synced_to_wechat_draft" || status === "scheduled") {
      if (!hashMatches) {
        blockers.push("当前审批版本已失效");
      } else if (this.config.publishMode !== "auto_publish") {
        blockers.push(
          this.config.publishMode === "draft_only"
            ? "当前为只建草稿模式，请在公众号后台人工发表"
            : "当前为 dry-run 模式，未配置自动发表",
        );
      }
    }

    const readyToSync =
      (status === "approved" || (status === "failed" && state.lastError?.stage === "sync")) &&
      hashMatches &&
      (isDryRun || configured);
    const readyToPublish =
      (status === "synced_to_wechat_draft" || status === "scheduled") &&
      hashMatches &&
      configured &&
      this.config.publishMode === "auto_publish" &&
      due;

    const nextAction =
      status === "draft" || status === "review_pending"
        ? "审核事实与措辞后调用 approve"
        : status === "approved"
          ? "运行 07:45 prepare-due 或手动 sync-draft"
          : status === "failed"
            ? "检查错误后调用 retry，或重新生成草稿"
            : status === "publishing"
              ? "轮询 publish status，不要重复提交"
              : status === "published"
                ? "记录文章 URL 并归档本期"
                : "等待 08:00 publish-due";

    return {
      issueKey: normalized,
      status,
      contentHash: currentHash,
      approvedContentHash: state.approvedContentHash,
      approvedAt: state.approvedAt,
      approvedBy: state.approvedBy,
      scheduledAt: issue.scheduledAt,
      timezone: issue.timezone || "Asia/Shanghai",
      publishMode: this.config.publishMode,
      configured,
      missingConfig: this.config.missing,
      readyToSync,
      readyToPublish,
      isDue: due,
      blockers: Array.from(new Set(blockers)),
      nextAction,
    };
  }

  getStatus(issueKey: string) {
    const normalized = assertIssueKey(issueKey);
    const issue = loadWeeklyIssue(normalized);
    const state = readDeliveryState(normalized, issue);
    return {
      readiness: this.getReadiness(normalized),
      delivery: state,
    };
  }

  listStatuses() {
    return {
      at: this.now().toISOString(),
      items: listWeeklyIssueKeys().map((issueKey) => {
        const status = this.getStatus(issueKey);
        return {
          ...status.readiness,
          delivery: status.delivery,
          previewPath: `/weekly/${issueKey}`,
        };
      }),
    };
  }

  async approve(issueKey: string, input: ApproveInput): Promise<WechatIssueReadiness> {
    const normalized = assertIssueKey(issueKey);
    return this.withIssueLock(normalized, () => {
      const reviewer = input.reviewer?.trim();
      if (!reviewer || reviewer.length < 2) {
        throw new WechatServiceError("必须填写审核人（至少 2 个字符）", { code: "REVIEWER_REQUIRED" });
      }
      const issue = loadWeeklyIssue(normalized);
      const currentHash = contentHashForIssue(issue);
      if (!input.contentHash || input.contentHash !== currentHash) {
        throw new WechatServiceError("内容哈希不一致，正文可能已修改，请刷新审核页面后重新确认", {
          statusCode: 409,
          code: "CONTENT_CHANGED",
        });
      }

      let state = readDeliveryState(normalized, issue);
      if (state.status === "published") {
        throw new WechatServiceError("文章已经发表，不能重新审批", {
          statusCode: 409,
          code: "ALREADY_PUBLISHED",
        });
      }

      const timestamp = this.now().toISOString();
      const hadOldContent = state.contentHash !== currentHash || state.approvedContentHash !== currentHash;
      state = {
        ...state,
        contentHash: currentHash,
        approvedContentHash: currentHash,
        approvedBy: reviewer,
        approvedAt: timestamp,
        reviewedAt: timestamp,
        status: "approved",
        lastError: undefined,
        wechat: hadOldContent
          ? { thumbMediaId: state.wechat?.thumbMediaId }
          : state.wechat,
      };
      state = appendAudit(state, {
        action: "approved",
        actor: reviewer,
        contentHash: currentHash,
        detail: hadOldContent ? "审批新版本；旧草稿引用已本地失效" : "人工终审通过",
      });
      writeDeliveryState(state);
      return this.getReadiness(normalized);
    });
  }

  async syncDraft(issueKey: string, options: ActionOptions = {}): Promise<WechatDeliveryResult> {
    const normalized = assertIssueKey(issueKey);
    return this.withIssueLock(normalized, () => this.syncDraftUnlocked(normalized, options));
  }

  private async syncDraftUnlocked(issueKey: string, options: ActionOptions = {}): Promise<WechatDeliveryResult> {
    const normalized = assertIssueKey(issueKey);
    const issue = loadWeeklyIssue(normalized);
    let state = readDeliveryState(normalized, issue);
    const currentHash = contentHashForIssue(issue);
    // dry_run is a hard safety boundary: a caller cannot override it and
    // accidentally reach the live WeChat API.
    const dryRun = options.dryRun === true || this.config.publishMode === "dry_run";

    if (state.status === "published" || state.status === "publishing") {
      throw new WechatServiceError("当前状态不能重新创建草稿", {
        statusCode: 409,
        code: "INVALID_SYNC_STATE",
      });
    }
    if (state.approvedContentHash !== currentHash || state.contentHash !== currentHash) {
      throw new WechatServiceError("内容尚未审批或审批版本已变化，请先重新终审", {
        statusCode: 409,
        code: "CONTENT_NOT_APPROVED",
      });
    }
    if (state.wechat?.mediaId && state.status !== "failed") {
      return {
        ok: true,
        dryRun,
        issueKey: normalized,
        status: state.status,
        message: "已存在同一审批版本的微信草稿，未重复创建",
        readiness: this.getReadiness(normalized),
      };
    }
    if (state.status !== "approved" && !(state.status === "failed" && state.lastError?.stage === "sync")) {
      throw new WechatServiceError(`当前状态 ${state.status} 不能创建微信草稿`, {
        statusCode: 409,
        code: "INVALID_SYNC_STATE",
      });
    }

    const rendered = renderWeeklyArticle(issue, {
      author: this.config.author,
      contentSourceUrl: this.config.contentSourceUrl,
    });
    const validationErrors = validateWechatArticle(rendered);
    if (validationErrors.length > 0) {
      throw new WechatServiceError(`微信文章格式不符合接口限制：${validationErrors.join("；")}`, {
        code: "ARTICLE_VALIDATION_FAILED",
      });
    }

    if (dryRun) {
      const timestamp = this.now().toISOString();
      state = appendAudit(state, {
        action: "sync_dry_run",
        contentHash: currentHash,
        detail: "dry-run：未调用微信接口，也未创建草稿",
        at: timestamp,
      });
      writeDeliveryState(state);
      return {
        ok: true,
        dryRun: true,
        issueKey: normalized,
        status: state.status,
        message: "dry-run 通过：标题、摘要和正文长度符合接口约束；未调用微信 API",
        readiness: this.getReadiness(normalized),
      };
    }

    if (!isConfigured(this.config)) {
      throw new WechatServiceError(`缺少微信配置：${this.config.missing.join(", ")}`, {
        code: "WECHAT_CONFIG_MISSING",
      });
    }

    try {
      let thumbMediaId = state.wechat?.thumbMediaId;
      if (!thumbMediaId) {
        const material = await this.client.addPermanentImage(this.config.coverImagePath);
        thumbMediaId = material.mediaId;
      }
      const draft = await this.client.addDraft({
        title: rendered.title,
        author: this.config.author,
        digest: rendered.digest,
        content: rendered.content,
        content_source_url: rendered.contentSourceUrl || undefined,
        thumb_media_id: thumbMediaId,
        need_open_comment: 0,
        only_fans_can_comment: 0,
      });
      const timestamp = this.now().toISOString();
      state = {
        ...state,
        status: this.config.publishMode === "auto_publish" ? "scheduled" : "synced_to_wechat_draft",
        attempts: { ...state.attempts, sync: state.attempts.sync + 1 },
        lastError: undefined,
        wechat: {
          ...state.wechat,
          mediaId: draft.mediaId,
          thumbMediaId,
          lastSyncedAt: timestamp,
          lastMessage: "草稿已创建",
        },
      };
      state = appendAudit(state, {
        action: "synced_to_wechat_draft",
        contentHash: currentHash,
        detail: `微信草稿 media_id=${draft.mediaId}`,
        at: timestamp,
      });
      writeDeliveryState(state);
      return {
        ok: true,
        dryRun: false,
        issueKey: normalized,
        status: state.status,
        message:
          this.config.publishMode === "auto_publish"
            ? "微信草稿已创建，等待计划发布时间"
            : "微信草稿已创建，请在公众号后台完成发表",
        readiness: this.getReadiness(normalized),
      };
    } catch (error) {
      const timestamp = this.now().toISOString();
      state = {
        ...setError(state, "sync", error, error instanceof WechatApiError ? error.retryable : true, timestamp),
        status: "failed",
        attempts: { ...state.attempts, sync: state.attempts.sync + 1 },
      };
      state = appendAudit(state, {
        action: "sync_failed",
        contentHash: currentHash,
        detail: redactSensitiveText(error),
        at: timestamp,
      });
      writeDeliveryState(state);
      throw error;
    }
  }

  async prepareDue(options: ActionOptions & { issueKey?: string; lookaheadMinutes?: number } = {}) {
    const now = this.now();
    const lookahead = (options.lookaheadMinutes ?? 30) * 60_000;
    const keys = options.issueKey ? [assertIssueKey(options.issueKey)] : listWeeklyIssueKeys();
    const results: WechatDeliveryResult[] = [];

    for (const issueKey of keys) {
      const issue = loadWeeklyIssue(issueKey);
      const state = readDeliveryState(issueKey, issue);
      const scheduled = Date.parse(state.scheduledAt);
      const inWindow =
        Number.isFinite(scheduled) &&
        scheduled - now.getTime() <= lookahead &&
        now.getTime() - scheduled <= 180 * 60_000;
      if (!inWindow || (state.status !== "approved" && !(state.status === "failed" && state.lastError?.stage === "sync"))) {
        continue;
      }
      results.push(await this.syncDraft(issueKey, { dryRun: options.dryRun }));
    }
    return {
      ok: true,
      at: now.toISOString(),
      processed: results.length,
      results,
    };
  }

  async publishDue(options: ActionOptions & { issueKey?: string } = {}) {
    const keys = options.issueKey ? [assertIssueKey(options.issueKey)] : listWeeklyIssueKeys();
    const results: WechatDeliveryResult[] = [];
    for (const issueKey of keys) {
      const result = await this.publishDueOne(issueKey, options);
      if (result) results.push(result);
    }

    return {
      ok: results.every((item) => item.ok || item.status === "published"),
      at: this.now().toISOString(),
      processed: results.length,
      results,
    };
  }

  private async publishDueOne(
    issueKey: string,
    options: ActionOptions & { issueKey?: string },
  ): Promise<WechatDeliveryResult | null> {
    const normalized = assertIssueKey(issueKey);
    return this.withIssueLock(normalized, async () => {
      const issue = loadWeeklyIssue(issueKey);
      let state = readDeliveryState(issueKey, issue);
      if (!options.issueKey && !issueIsDue(state, this.now())) return null;
      if (options.issueKey && !issueIsDue(state, this.now())) {
        return {
          ok: false,
          dryRun: this.config.publishMode === "dry_run",
          issueKey,
          status: state.status,
          message: `尚未到计划发布时间：${state.scheduledAt}`,
          readiness: this.getReadiness(issueKey),
        };
      }
      if (state.status === "published") {
        return {
          ok: true,
          dryRun: false,
          issueKey,
          status: state.status,
          message: "文章已经发表，跳过重复提交",
          readiness: this.getReadiness(issueKey),
        };
      }
      if (state.wechat?.publishId) {
        const refreshed = await this.refreshPublishStatusUnlocked(issueKey);
        return {
          ...refreshed,
          message: "已有 publish_id，未重复提交；已刷新状态",
        };
      }
      const hashMatches = state.approvedContentHash === contentHashForIssue(issue);
      if (!hashMatches || (state.status !== "scheduled" && state.status !== "synced_to_wechat_draft") || !state.wechat?.mediaId) {
        return {
          ok: false,
          dryRun: this.config.publishMode === "dry_run",
          issueKey,
          status: state.status,
          message: "未满足自动发表条件：需要已审批、同一版本且已同步微信草稿",
          readiness: this.getReadiness(issueKey),
        };
      }
      if (this.config.publishMode === "draft_only") {
        return {
          ok: false,
          dryRun: false,
          issueKey,
          status: state.status,
          message: "当前为 draft_only 模式，请在公众号后台人工发表",
          readiness: this.getReadiness(issueKey),
        };
      }
      if (options.dryRun || this.config.publishMode === "dry_run") {
        return {
          ok: true,
          dryRun: true,
          issueKey,
          status: state.status,
          message: "dry-run：已满足定时发表条件，未调用 freepublish/submit",
          readiness: this.getReadiness(issueKey),
        };
      }
      if (!isConfigured(this.config)) {
        throw new WechatServiceError(`缺少微信配置：${this.config.missing.join(", ")}`, {
          code: "WECHAT_CONFIG_MISSING",
        });
      }

      const mediaId = state.wechat.mediaId;
      const timestamp = this.now().toISOString();
      state = {
        ...state,
        status: "publishing",
        attempts: { ...state.attempts, publish: state.attempts.publish + 1 },
        lastError: undefined,
      };
      state = appendAudit(state, {
        action: "publish_submit_requested",
        contentHash: state.approvedContentHash,
        detail: `准备提交微信草稿 ${mediaId}`,
        at: timestamp,
      });
      writeDeliveryState(state);

      try {
        const submitted = await this.client.submitFreepublish(mediaId);
        const submittedAt = this.now().toISOString();
        state = {
          ...state,
          status: "publishing",
          wechat: {
            ...state.wechat,
            publishId: submitted.publishId,
            publishStatus: submitted.publishStatus,
            lastCheckedAt: submittedAt,
            lastMessage: "freepublish/submit 已接受",
          },
        };
        state = appendAudit(state, {
          action: "publish_submitted",
          contentHash: state.approvedContentHash,
          detail: `publish_id=${submitted.publishId}`,
          at: submittedAt,
        });
        writeDeliveryState(state);
        return this.refreshPublishStatusUnlocked(issueKey);
      } catch (error) {
        const failedAt = this.now().toISOString();
        state = {
          ...setError(state, "publish", error, false, failedAt),
          status: "needs_manual_action",
          wechat: {
            ...state.wechat,
            lastMessage: "提交发布结果不确定，请到公众号后台核对，避免重复提交",
          },
        };
        state = appendAudit(state, {
          action: "publish_failed_or_unknown",
          detail: redactSensitiveText(error),
          at: failedAt,
        });
        writeDeliveryState(state);
        throw error;
      }
    });
  }

  async refreshPublishStatus(issueKey: string): Promise<WechatDeliveryResult> {
    const normalized = assertIssueKey(issueKey);
    return this.withIssueLock(normalized, () => this.refreshPublishStatusUnlocked(normalized));
  }

  private async refreshPublishStatusUnlocked(issueKey: string): Promise<WechatDeliveryResult> {
    const normalized = assertIssueKey(issueKey);
    const issue = loadWeeklyIssue(normalized);
    let state = readDeliveryState(normalized, issue);
    const publishId = state.wechat?.publishId;
    if (!publishId) {
      throw new WechatServiceError("当前周报没有 publish_id，不能查询发表状态", {
        code: "PUBLISH_ID_MISSING",
      });
    }
    if (!isConfigured(this.config)) {
      throw new WechatServiceError(`缺少微信配置：${this.config.missing.join(", ")}`, {
        code: "WECHAT_CONFIG_MISSING",
      });
    }

    try {
      const result = await this.client.getPublishStatus(publishId);
      const kind = publishStatusKind(result.publishStatus);
      const timestamp = this.now().toISOString();
      const articleUrl = result.articleUrl || state.wechat?.articleUrl;
      state = {
        ...state,
        status: kind.state,
        wechat: {
          ...state.wechat,
          publishStatus: result.publishStatus,
          articleUrl,
          lastCheckedAt: timestamp,
          lastMessage: kind.message,
        },
        lastError:
          kind.state === "failed" || kind.state === "needs_manual_action"
            ? {
                at: timestamp,
                stage: "status",
                code: String(result.publishStatus),
                message: kind.message,
                retryable: false,
              }
            : undefined,
      };
      state = appendAudit(state, {
        action: "publish_status_checked",
        detail: `${kind.message}（publish_status=${String(result.publishStatus)}）`,
        at: timestamp,
      });
      writeDeliveryState(state);
      return {
        ok: kind.state === "published" || kind.state === "publishing",
        dryRun: false,
        issueKey: normalized,
        status: state.status,
        message: kind.message,
        readiness: this.getReadiness(normalized),
        publishId,
        articleUrl,
      };
    } catch (error) {
      const timestamp = this.now().toISOString();
      state = setError(state, "status", error, error instanceof WechatApiError ? error.retryable : true, timestamp);
      writeDeliveryState(state);
      throw error;
    }
  }

  async retry(issueKey: string): Promise<WechatIssueReadiness> {
    const normalized = assertIssueKey(issueKey);
    return this.withIssueLock(normalized, () => {
      const issue = loadWeeklyIssue(normalized);
      let state = readDeliveryState(normalized, issue);
      if (!state.lastError) {
        throw new WechatServiceError("当前没有可重试的错误", { code: "NOTHING_TO_RETRY" });
      }
      if (!state.lastError.retryable) {
        throw new WechatServiceError("该错误被标记为需要人工核对，不能自动重试", {
          statusCode: 409,
          code: "RETRY_REQUIRES_MANUAL_CHECK",
        });
      }
      const timestamp = this.now().toISOString();
      if (state.lastError.stage === "sync") {
        state = { ...state, status: "approved", lastError: undefined };
      } else if (state.lastError.stage === "status" && state.wechat?.publishId) {
        state = { ...state, status: "publishing", lastError: undefined };
      } else {
        throw new WechatServiceError("当前错误无法安全自动重试", {
          statusCode: 409,
          code: "UNSAFE_RETRY",
        });
      }
      state = appendAudit(state, {
        action: "retry_requested",
        detail: `重试阶段：${state.lastError?.stage || "unknown"}`,
        at: timestamp,
      });
      writeDeliveryState(state);
      return this.getReadiness(normalized);
    });
  }

  resetForTesting(issueKey: string): WechatDeliveryState {
    const issue = loadWeeklyIssue(issueKey);
    const state = createInitialDeliveryState(issue, this.now());
    writeDeliveryState(state);
    return state;
  }
}

export function mapWechatPublishStatus(status: number | string): {
  state: WeeklyDeliveryStatus;
  message: string;
} {
  return publishStatusKind(status);
}
