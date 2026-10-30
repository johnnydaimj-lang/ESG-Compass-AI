import { existsSync } from "node:fs";
import { getWechatConfig, publicWechatConfig } from "@/lib/wechat/config";
import { printJson } from "./_args";

const config = getWechatConfig();
const result = {
  ...publicWechatConfig(config),
  coverImageExists: existsSync(config.coverImagePath),
  author: config.author,
  contentSourceUrl: config.contentSourceUrl || null,
  callbackVerificationEnabled: Boolean(config.callbackToken),
  checks: {
    credentials: Boolean(config.appId && config.appSecret),
    coverImage: existsSync(config.coverImagePath),
  },
  optionalFeatures: {
    contentSourceUrl: Boolean(config.contentSourceUrl),
    externalScheduler: Boolean(config.cronSecret),
  },
};

printJson(result);
if (config.publishMode !== "dry_run" && config.missing.length > 0) process.exitCode = 1;
