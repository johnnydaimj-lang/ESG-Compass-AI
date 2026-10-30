import type { WeeklyIssue } from "@/lib/wechat/types";

export interface RenderWeeklyOptions {
  author: string;
  contentSourceUrl: string;
}

export interface RenderedWechatArticle {
  title: string;
  digest: string;
  content: string;
  contentSourceUrl: string;
}

const WECHAT_TITLE_MAX_LENGTH = 64;
const WECHAT_DIGEST_MAX_LENGTH = 120;

export function resolveWeeklySourceUrl(template: string, issueKey: string): string {
  const value = template.trim();
  if (!value) return "";
  return value.includes("{issueKey}")
    ? value.replaceAll("{issueKey}", encodeURIComponent(issueKey))
    : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value: string): string {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? escapeHtml(parsed.toString()) : "";
  } catch {
    return "";
  }
}

function link(label: string, url: string): string {
  const href = safeUrl(url);
  return href
    ? `<a href="${href}" style="color:#0f766e;text-decoration:none">${escapeHtml(label)}</a>`
    : escapeHtml(label);
}

function truncateUnicode(value: string, maxLength: number): string {
  const chars = Array.from(value);
  return chars.length <= maxLength ? value : chars.slice(0, Math.max(0, maxLength - 1)).join("") + "…";
}

function articleTitle(issue: WeeklyIssue): string {
  return truncateUnicode(issue.headline, WECHAT_TITLE_MAX_LENGTH);
}

function storyHtml(story: WeeklyIssue["stories"][number]): string {
  const watchpoints = story.watchpoints
    .map(
      (point) =>
        `<p style="margin:6px 0 0 0;color:#57534e;font-size:14px;line-height:1.9">• ${escapeHtml(point)}</p>`,
    )
    .join("");
  const stakeholders = story.stakeholders
    .map(
      (item) =>
        `<span style="display:inline-block;margin:8px 6px 0 0;padding:3px 8px;border:1px solid #d6d3d1;border-radius:4px;color:#78716c;font-size:12px">${escapeHtml(item)}</span>`,
    )
    .join("");

  return `<section style="margin:30px 0 0 0;padding-top:18px;border-top:2px solid #1c1917">
    <p style="margin:0;color:#a8a29e;font-family:monospace;font-size:28px;line-height:1">${escapeHtml(story.number)}</p>
    <span style="display:inline-block;margin-top:10px;padding:4px 8px;background:#f0fdfa;color:#115e59;font-size:12px">${escapeHtml(story.category)}</span>
    <h2 style="margin:12px 0 0 0;color:#1c1917;font-size:23px;line-height:1.5;font-weight:600">${escapeHtml(story.title)}</h2>
    <p style="margin:8px 0 0 0;color:#a8a29e;font-size:13px;line-height:1.7">${escapeHtml(story.originalTitle)}</p>
    <p style="margin:10px 0 0 0;color:#57534e;font-size:13px;line-height:1.7">${escapeHtml(story.source)} · ${escapeHtml(story.sourceDate)} · ${link("查看原文", story.url)}</p>
    <p style="margin:22px 0 0 0;color:#a8a29e;font-size:11px;letter-spacing:0.08em">WHAT HAPPENED</p>
    <p style="margin:7px 0 0 0;color:#57534e;font-size:15px;line-height:1.9">${escapeHtml(story.fact)}</p>
    <section style="margin:18px 0 0 0;padding:14px 16px;border-left:3px solid #0f766e;background:#f0fdfa">
      <p style="margin:0;color:#115e59;font-size:13px;font-weight:600">观澜解读</p>
      <p style="margin:8px 0 0 0;color:#1c1917;font-size:15px;line-height:1.9">${escapeHtml(story.interpretation)}</p>
    </section>
    <p style="margin:20px 0 0 0;color:#1c1917;font-size:13px;font-weight:600">后续观察点</p>
    ${watchpoints}
    <div style="margin-top:12px">${stakeholders}</div>
  </section>`;
}

function quickBriefHtml(brief: WeeklyIssue["quickBriefs"][number]): string {
  return `<section style="margin:18px 0 0 0;padding-top:16px;border-top:1px solid #e7e5e4">
    <p style="margin:0;color:#0f766e;font-size:12px;font-weight:600">${escapeHtml(brief.category)}</p>
    <h3 style="margin:7px 0 0 0;color:#1c1917;font-size:17px;line-height:1.6;font-weight:600">${escapeHtml(brief.title)}</h3>
    <p style="margin:8px 0 0 0;color:#57534e;font-size:14px;line-height:1.8">${escapeHtml(brief.fact)}</p>
    <p style="margin:8px 0 0 0;font-size:13px">${link("阅读来源", brief.href)}</p>
  </section>`;
}

export function renderWeeklyArticle(issue: WeeklyIssue, options: RenderWeeklyOptions): RenderedWechatArticle {
  const contents = issue.contents
    .map(
      (item, index) =>
        `<p style="margin:10px 0 0 0;color:#57534e;font-size:14px;line-height:1.8"><span style="color:#0f766e;font-family:monospace">${String(index + 1).padStart(2, "0")}</span>　${escapeHtml(item)}</p>`,
    )
    .join("");
  const sources = issue.sources
    .map(
      (source, index) =>
        `<p style="margin:7px 0 0 0;color:#78716c;font-size:12px;line-height:1.7"><span style="color:#0f766e;font-family:monospace">${String(index + 1).padStart(2, "0")}</span>　${link(source.name, source.url)}</p>`,
    )
    .join("");

  const content = `<section style="max-width:720px;margin:0 auto;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif">
  <section style="padding-bottom:20px;border-bottom:1px solid #e7e5e4">
    <p style="margin:0;color:#0f766e;font-size:12px;letter-spacing:0.12em">WEEKLY BRIEF · ${escapeHtml(String(issue.year))} / W${String(issue.week).padStart(2, "0")}</p>
    <h1 style="margin:12px 0 0 0;color:#1c1917;font-size:30px;line-height:1.35;font-weight:600">${escapeHtml(issue.headline)}</h1>
    <p style="margin:14px 0 0 0;color:#57534e;font-size:15px;line-height:1.9">${escapeHtml(issue.deck)}</p>
    <p style="margin:16px 0 0 0;color:#a8a29e;font-size:12px;line-height:1.7">${escapeHtml(issue.rangeStart)}—${escapeHtml(issue.rangeEnd)}　·　第 ${issue.week} 周　·　预计 ${issue.stats.readingMinutes} 分钟</p>
  </section>
  <section style="display:flex;flex-wrap:wrap;margin-top:18px;padding:14px 0;border-bottom:1px solid #e7e5e4">
    <span style="width:50%;margin:0 0 12px 0;color:#57534e;font-size:12px">本周扫描 <strong style="color:#1c1917;font-size:18px">${issue.stats.itemsScanned}</strong> 条</span>
    <span style="width:50%;margin:0 0 12px 0;color:#57534e;font-size:12px">区间内容 <strong style="color:#1c1917;font-size:18px">${issue.stats.itemsInRange}</strong> 条</span>
    <span style="width:50%;color:#57534e;font-size:12px">主线议题 <strong style="color:#1c1917;font-size:18px">${issue.stats.mainStories}</strong> 个</span>
    <span style="width:50%;color:#57534e;font-size:12px">预计阅读 <strong style="color:#1c1917;font-size:18px">${issue.stats.readingMinutes}</strong> 分钟</span>
  </section>
  <section style="margin-top:26px">
    <p style="margin:0;color:#0f766e;font-size:12px;letter-spacing:0.12em">EDITOR'S NOTE</p>
    <h2 style="margin:7px 0 0 0;color:#1c1917;font-size:20px;font-weight:600">本期导读</h2>
    <p style="margin:12px 0 0 0;color:#1c1917;font-size:15px;line-height:1.9">${escapeHtml(issue.intro)}</p>
    ${contents}
  </section>
  <section style="margin-top:28px">
    ${issue.stories.map(storyHtml).join("")}
  </section>
  <section style="margin-top:34px;padding-top:18px;border-top:2px solid #1c1917">
    <p style="margin:0;color:#0f766e;font-size:12px;letter-spacing:0.12em">QUICK BRIEFS</p>
    <h2 style="margin:7px 0 0 0;color:#1c1917;font-size:20px;font-weight:600">本周快讯</h2>
    ${issue.quickBriefs.map(quickBriefHtml).join("")}
  </section>
  <section style="margin-top:32px;padding-top:18px;border-top:1px solid #e7e5e4">
    <p style="margin:0;color:#0f766e;font-size:12px;letter-spacing:0.12em">OUTLOOK</p>
    <h2 style="margin:7px 0 0 0;color:#1c1917;font-size:20px;font-weight:600">下周看什么</h2>
    <p style="margin:12px 0 0 0;color:#57534e;font-size:15px;line-height:1.9">${escapeHtml(issue.outlook)}</p>
  </section>
  <section style="margin-top:30px;padding-top:18px;border-top:1px solid #e7e5e4">
    <h2 style="margin:0 0 8px 0;color:#1c1917;font-size:16px;font-weight:600">本期信源</h2>
    ${sources}
    <p style="margin:18px 0 0 0;padding-top:14px;border-top:1px solid #e7e5e4;color:#a8a29e;font-size:12px;line-height:1.8">${escapeHtml(issue.editorial.methodology)}</p>
  </section>
  <section style="margin-top:26px;padding:16px;background:#fafaf8;color:#78716c;font-size:12px;line-height:1.8">
    <strong style="color:#1c1917">观澜 ${escapeHtml(options.author)}</strong><br>
    每周筛选全球 ESG 关键变化，用事实、解读和观察点帮助读者理解规则与资本流向。<br>
    AI 辅助整理，发布前经人工审阅。
  </section>
</section>`;

  return {
    title: articleTitle(issue),
    digest: truncateUnicode(issue.deck, WECHAT_DIGEST_MAX_LENGTH),
    content: content.replace(/>\s+</g, "><").trim(),
    contentSourceUrl: resolveWeeklySourceUrl(
      options.contentSourceUrl,
      `${issue.year}-w${String(issue.week).padStart(2, "0")}`,
    ),
  };
}

export function validateWechatArticle(article: RenderedWechatArticle): string[] {
  const errors: string[] = [];
  if (Array.from(article.title).length > WECHAT_TITLE_MAX_LENGTH) {
    errors.push(`标题超过 ${WECHAT_TITLE_MAX_LENGTH} 字`);
  }
  if (Array.from(article.digest).length > WECHAT_DIGEST_MAX_LENGTH) {
    errors.push(`摘要超过 ${WECHAT_DIGEST_MAX_LENGTH} 字`);
  }
  if (article.content.length >= 20_000) errors.push("正文超过 2 万字符");
  if (Buffer.byteLength(article.content, "utf8") >= 1024 * 1024) errors.push("正文超过 1MB");
  if (article.contentSourceUrl && !safeUrl(article.contentSourceUrl)) {
    errors.push("原文链接不是有效的 http(s) URL");
  }
  return errors;
}
