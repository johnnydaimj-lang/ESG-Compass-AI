import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { WechatConfig, WechatPublishMode } from "@/lib/wechat/types";

function loadLocalEnvFile(): void {
  try {
    const path = resolve(process.cwd(), ".env.local");
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^\r\n]*)\s*$/);
      if (!match) continue;

      const value = match[2].replace(/^["']|["']$/g, "").trim();
      // Keep real process variables authoritative, especially for deployments.
      if (value && process.env[match[1]] === undefined) {
        process.env[match[1]] = value;
      }
    }
  } catch {
    // .env.local is optional. Next.js loads it automatically in the app.
  }
}

function readMode(): WechatPublishMode {
  const value = process.env.WECHAT_PUBLISH_MODE?.trim().toLowerCase();
  if (value === "draft_only" || value === "auto_publish") return value;
  return "dry_run";
}

export function getWechatConfig(): WechatConfig {
  loadLocalEnvFile();
  const missing: string[] = [];
  const appId = process.env.WECHAT_APP_ID?.trim() || "";
  const appSecret = process.env.WECHAT_APP_SECRET?.trim() || "";
  const contentSourceUrl = process.env.WECHAT_ARTICLE_SOURCE_URL?.trim() || "";

  if (!appId) missing.push("WECHAT_APP_ID");
  if (!appSecret) missing.push("WECHAT_APP_SECRET");

  return {
    appId,
    appSecret,
    author: process.env.WECHAT_AUTHOR?.trim() || "观澜 ESG Compass",
    contentSourceUrl,
    coverImagePath: resolve(process.cwd(), "public", "wechat-avatar.png"),
    publishMode: readMode(),
    stateBackend: "file",
    callbackToken: process.env.WECHAT_CALLBACK_TOKEN?.trim() || "",
    callbackAesKey: process.env.WECHAT_CALLBACK_AES_KEY?.trim() || "",
    cronSecret: process.env.WECHAT_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "",
    apiBaseUrl: process.env.WECHAT_API_BASE_URL?.trim().replace(/\/+$/, "") || "https://api.weixin.qq.com",
    missing,
  };
}

export function publicWechatConfig(config = getWechatConfig()) {
  return {
    configured: config.missing.length === 0,
    missingConfig: config.missing,
    publishMode: config.publishMode,
    stateBackend: config.stateBackend,
  };
}
