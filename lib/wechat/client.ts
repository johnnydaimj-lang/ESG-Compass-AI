import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import type {
  WechatApi,
  WechatConfig,
  WechatDraftArticle,
  WechatMaterialResult,
  WechatPublishResult,
  WechatPublishStatusResult,
} from "@/lib/wechat/types";
import { redactSensitiveText } from "@/lib/wechat/sanitize";

const TOKEN_FILE = resolve(process.cwd(), "data", "wechat", "state", "access-token.json");

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface WechatResponse {
  errcode?: number;
  errmsg?: string;
  access_token?: string;
  expires_in?: number;
  media_id?: string;
  url?: string;
  publish_id?: string;
  publish_status?: number | string;
  article_id?: string;
  article_detail?: {
    item?: Array<{ article_url?: string; article_id?: string }>;
  };
  [key: string]: unknown;
}

export class WechatApiError extends Error {
  code?: number | string;
  retryable: boolean;
  status?: number;

  constructor(message: string, options: { code?: number | string; retryable?: boolean; status?: number } = {}) {
    super(message);
    this.name = "WechatApiError";
    this.code = options.code;
    this.retryable = options.retryable ?? true;
    this.status = options.status;
  }
}

function readCachedToken(): CachedToken | null {
  try {
    if (!existsSync(TOKEN_FILE)) return null;
    const parsed = JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as CachedToken;
    if (typeof parsed.accessToken !== "string" || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt <= Date.now() + 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function restrictTokenFileToCurrentUser(path: string): void {
  if (process.platform !== "win32") return;
  const username = process.env.USERNAME?.trim();
  if (!username) throw new Error("无法确定当前 Windows 用户，已拒绝缓存 access_token");
  const principal = process.env.USERDOMAIN
    ? `${process.env.USERDOMAIN}\\${username}`
    : username;
  const result = spawnSync(
    "icacls",
    [path, "/inheritance:r", "/grant:r", `${principal}:F`],
    { windowsHide: true, stdio: "ignore" },
  );
  if (result.status !== 0) {
    throw new Error("无法限制 access_token 缓存文件权限，已停止写入");
  }
}

function writeCachedToken(token: CachedToken): void {
  mkdirSync(dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
  const temporary = `${TOKEN_FILE}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(token), { encoding: "utf8", mode: 0o600 });
    restrictTokenFileToCurrentUser(temporary);
    try {
      renameSync(temporary, TOKEN_FILE);
    } catch {
      if (existsSync(TOKEN_FILE)) unlinkSync(TOKEN_FILE);
      renameSync(temporary, TOKEN_FILE);
    }
  } catch {
    for (const path of [temporary, TOKEN_FILE]) {
      try {
        if (existsSync(path)) unlinkSync(path);
      } catch {
        // Best-effort cleanup; the original error is more useful.
      }
    }
    throw new Error("access_token 缓存写入失败，未保存凭据");
  }
}

function errorFromResponse(data: WechatResponse, status?: number): WechatApiError | null {
  if (data.errcode && data.errcode !== 0) {
    const code = data.errcode;
    // 40001/40014/42001 是 token 类错误；45009 是接口频率限制。
    const retryable = [40001, 40014, 42001, 45009, -1].includes(Number(code));
    return new WechatApiError(redactSensitiveText(data.errmsg || `微信接口错误 ${code}`), {
      code,
      retryable,
      status,
    });
  }
  if (status && status >= 400) {
    return new WechatApiError(`微信接口 HTTP ${status}`, { status, retryable: status >= 500 });
  }
  return null;
}

async function requestJson(url: string, init?: RequestInit): Promise<WechatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
      cache: "no-store",
    });
    const text = await response.text();
    let data: WechatResponse;
    try {
      data = text ? (JSON.parse(text) as WechatResponse) : {};
    } catch {
      throw new WechatApiError(`微信接口返回了非 JSON 内容（HTTP ${response.status}）`, {
        status: response.status,
        retryable: response.status >= 500,
      });
    }
    const apiError = errorFromResponse(data, response.status);
    if (apiError) throw apiError;
    return data;
  } catch (error) {
    if (error instanceof WechatApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WechatApiError("微信接口请求超时", { retryable: true });
    }
    throw new WechatApiError(redactSensitiveText(error), {
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export class WechatClient implements WechatApi {
  constructor(private readonly config: WechatConfig) {}

  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh) {
      const cached = readCachedToken();
      if (cached) return cached.accessToken;
    }

    if (!this.config.appId || !this.config.appSecret) {
      throw new WechatApiError("缺少 WECHAT_APP_ID 或 WECHAT_APP_SECRET", {
        code: "CONFIG_MISSING",
        retryable: false,
      });
    }

    const data = await requestJson(`${this.config.apiBaseUrl}/cgi-bin/stable_token`, {
      method: "POST",
      body: JSON.stringify({
        grant_type: "client_credential",
        appid: this.config.appId,
        secret: this.config.appSecret,
        force_refresh: forceRefresh,
      }),
    });

    if (!data.access_token) {
      throw new WechatApiError("微信未返回 access_token", {
        code: data.errcode,
        retryable: true,
      });
    }

    const expiresIn = Math.max(300, Number(data.expires_in) || 7200);
    writeCachedToken({
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    });
    return data.access_token;
  }

  private async withToken<T>(operation: (accessToken: string) => Promise<T>): Promise<T> {
    try {
      return await operation(await this.getAccessToken());
    } catch (error) {
      if (error instanceof WechatApiError && [40001, 40014, 42001].includes(Number(error.code))) {
        return operation(await this.getAccessToken(true));
      }
      throw error;
    }
  }

  async addPermanentImage(filePath: string): Promise<WechatMaterialResult> {
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new WechatApiError(`封面文件不存在：${basename(filePath)}`, {
        code: "COVER_MISSING",
        retryable: false,
      });
    }

    return this.withToken(async (accessToken) => {
      const form = new FormData();
      const bytes = readFileSync(filePath);
      form.append("media", new Blob([bytes], { type: "image/png" }), basename(filePath));
      const data = await requestJson(
        `${this.config.apiBaseUrl}/cgi-bin/material/add_material?access_token=${encodeURIComponent(accessToken)}&type=image`,
        { method: "POST", body: form },
      );
      if (!data.media_id) {
        throw new WechatApiError("微信未返回封面 media_id", {
          code: data.errcode,
          retryable: true,
        });
      }
      return { mediaId: data.media_id, url: data.url };
    });
  }

  async addDraft(article: WechatDraftArticle): Promise<{ mediaId: string }> {
    return this.withToken(async (accessToken) => {
      const data = await requestJson(
        `${this.config.apiBaseUrl}/cgi-bin/draft/add?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          body: JSON.stringify({ articles: [article] }),
        },
      );
      if (!data.media_id) {
        throw new WechatApiError("微信未返回草稿 media_id", {
          code: data.errcode,
          retryable: true,
        });
      }
      return { mediaId: data.media_id };
    });
  }

  async submitFreepublish(mediaId: string): Promise<WechatPublishResult> {
    return this.withToken(async (accessToken) => {
      const data = await requestJson(
        `${this.config.apiBaseUrl}/cgi-bin/freepublish/submit?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          body: JSON.stringify({ media_id: mediaId }),
        },
      );
      if (!data.publish_id) {
        throw new WechatApiError("微信未返回 publish_id", {
          code: data.errcode,
          retryable: true,
        });
      }
      return {
        publishId: String(data.publish_id),
        publishStatus: data.publish_status,
        raw: data as Record<string, unknown>,
      };
    });
  }

  async getPublishStatus(publishId: string): Promise<WechatPublishStatusResult> {
    return this.withToken(async (accessToken) => {
      const data = await requestJson(
        `${this.config.apiBaseUrl}/cgi-bin/freepublish/get?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          body: JSON.stringify({ publish_id: publishId }),
        },
      );
      if (data.publish_status === undefined) {
        throw new WechatApiError("微信未返回 publish_status", {
          code: data.errcode,
          retryable: true,
        });
      }
      const item = data.article_detail?.item?.[0];
      return {
        publishStatus: data.publish_status,
        articleUrl: item?.article_url,
        articleId: item?.article_id || data.article_id,
        raw: data as Record<string, unknown>,
      };
    });
  }
}
