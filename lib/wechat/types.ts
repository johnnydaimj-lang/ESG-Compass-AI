export type WeeklyDeliveryStatus =
  | "draft"
  | "review_pending"
  | "approved"
  | "synced_to_wechat_draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "needs_manual_action";

export type WechatPublishMode = "dry_run" | "draft_only" | "auto_publish";

export interface WeeklyStory {
  number: string;
  category: string;
  title: string;
  originalTitle: string;
  source: string;
  sourceDate: string;
  url: string;
  fact: string;
  interpretation: string;
  watchpoints: string[];
  stakeholders: string[];
}

export interface WeeklyQuickBrief {
  category: string;
  title: string;
  fact: string;
  href: string;
}

export interface WeeklySource {
  name: string;
  date: string;
  url: string;
}

export interface WeeklyIssue {
  issue: number;
  year: number;
  week: number;
  status: string;
  rangeStart: string;
  rangeEnd: string;
  scheduledAt: string;
  timezone: string;
  headline: string;
  deck: string;
  stats: {
    itemsScanned: number;
    itemsInRange: number;
    mainStories: number;
    readingMinutes: number;
  };
  intro: string;
  contents: string[];
  stories: WeeklyStory[];
  quickBriefs: WeeklyQuickBrief[];
  outlook: string;
  sources: WeeklySource[];
  editorial: {
    title: string;
    reviewStatus: string;
    note: string;
    methodology: string;
  };
}

export interface WechatDraftArticle {
  title: string;
  author: string;
  digest: string;
  content: string;
  content_source_url?: string;
  thumb_media_id: string;
  need_open_comment?: 0 | 1;
  only_fans_can_comment?: 0 | 1;
}

export interface WechatPublishResult {
  publishId: string;
  publishStatus?: number | string;
  articleUrl?: string;
  raw?: Record<string, unknown>;
}

export interface WechatPublishStatusResult {
  publishStatus: number | string;
  articleUrl?: string;
  articleId?: string;
  raw?: Record<string, unknown>;
}

export interface WechatMaterialResult {
  mediaId: string;
  url?: string;
}

export interface WechatApi {
  addPermanentImage(filePath: string): Promise<WechatMaterialResult>;
  addDraft(article: WechatDraftArticle): Promise<{ mediaId: string }>;
  submitFreepublish(mediaId: string): Promise<WechatPublishResult>;
  getPublishStatus(publishId: string): Promise<WechatPublishStatusResult>;
}

export interface WechatConfig {
  appId: string;
  appSecret: string;
  author: string;
  contentSourceUrl: string;
  coverImagePath: string;
  publishMode: WechatPublishMode;
  stateBackend: "file";
  callbackToken: string;
  callbackAesKey: string;
  cronSecret: string;
  apiBaseUrl: string;
  missing: string[];
}

export interface WechatAuditEvent {
  at: string;
  action: string;
  actor?: string;
  detail?: string;
  contentHash?: string;
}

export interface WechatLastError {
  at: string;
  stage: "approve" | "sync" | "publish" | "status";
  code?: string | number;
  message: string;
  retryable: boolean;
}

export interface WechatDeliveryState {
  version: 1;
  issueKey: string;
  issue: number;
  year: number;
  week: number;
  status: WeeklyDeliveryStatus;
  contentHash: string;
  approvedContentHash?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewedAt?: string;
  scheduledAt: string;
  timezone: string;
  wechat?: {
    mediaId?: string;
    thumbMediaId?: string;
    publishId?: string;
    publishStatus?: number | string;
    articleUrl?: string;
    lastSyncedAt?: string;
    lastCheckedAt?: string;
    lastMessage?: string;
  };
  attempts: {
    sync: number;
    publish: number;
  };
  lastError?: WechatLastError;
  history: WechatAuditEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface WechatIssueReadiness {
  issueKey: string;
  status: WeeklyDeliveryStatus;
  contentHash: string;
  approvedContentHash?: string;
  approvedAt?: string;
  approvedBy?: string;
  scheduledAt: string;
  timezone: string;
  publishMode: WechatPublishMode;
  configured: boolean;
  missingConfig: string[];
  readyToSync: boolean;
  readyToPublish: boolean;
  isDue: boolean;
  blockers: string[];
  nextAction: string;
}

export interface WechatDeliveryResult {
  ok: boolean;
  dryRun: boolean;
  issueKey: string;
  status: WeeklyDeliveryStatus;
  message: string;
  readiness: WechatIssueReadiness;
  publishId?: string;
  articleUrl?: string;
}
