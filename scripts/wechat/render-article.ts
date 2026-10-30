import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getWechatConfig } from "@/lib/wechat/config";
import { loadWeeklyIssue } from "@/lib/wechat/delivery-store";
import { renderWeeklyArticle, validateWechatArticle } from "@/lib/wechat/render-weekly";
import { printJson, requireIssueKey } from "./_args";

const issueKey = requireIssueKey();
const issue = loadWeeklyIssue(issueKey);
const config = getWechatConfig();
const article = renderWeeklyArticle(issue, {
  author: config.author,
  contentSourceUrl: config.contentSourceUrl,
});
const errors = validateWechatArticle(article);
const target = resolve(process.cwd(), "data", "wechat", "render", `${issueKey}.html`);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#fafaf8">${article.content}</body></html>`,
  "utf8",
);

printJson({
  issueKey,
  title: article.title,
  titleLength: Array.from(article.title).length,
  digestLength: Array.from(article.digest).length,
  contentCharacters: article.content.length,
  contentBytes: Buffer.byteLength(article.content, "utf8"),
  valid: errors.length === 0,
  errors,
  htmlPreview: target,
});
if (errors.length > 0) process.exitCode = 1;
