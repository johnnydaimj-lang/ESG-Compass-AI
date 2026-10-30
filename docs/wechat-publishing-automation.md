# 观澜微信公众号发布自动化

## 结论先行

可以实现“人工终审后自动建草稿，并在每周一北京时间 08:00 提交发表”，但必须区分两件事：

- 微信 `freepublish/submit` 只负责提交发表任务，没有 `publish_time` 或原生定时参数。
- 08:00 的定时必须由外部 cron 调用本项目受保护接口完成。

首次接入默认是 `dry_run`，不会调用微信服务器。确认公众号具备接口权限后，再切换为 `draft_only` 或 `auto_publish`。

微信公众号账号类型和认证状态会影响可调用接口。正式注册后，以公众平台后台显示的接口权限为准；如果订阅号没有 `freepublish/submit` 权限，系统会停在“已建草稿”状态，需在后台人工发表。

## 发布链路

```text
周报 JSON
  -> 生成内联样式 HTML
  -> review_pending
  -> approve（审核人 + 内容哈希）
  -> approved
  -> prepare-due（07:45 上传封面、创建草稿）
  -> scheduled（保存 media_id）
  -> publish-due（周一 08:00 提交发表）
  -> publishing（保存 publish_id）
  -> poll/get（确认 published 或人工处理）
```

审计规则：

- 审批必须提交审核人和当前正文的 `contentHash`。
- 正文、标题、来源或计划时间发生变化，旧审批自动失效。
- 草稿创建后再次修改正文，必须重新终审，不能沿用旧 `media_id`。
- 已经有 `publish_id` 的任务不会重复提交，只刷新状态，避免重复发表。

## 正文如何进入公众号

正文不依赖公开网页，也不需要部署 Vercel 或绑定域名。公众号 `draft/add` 接口可以直接
接收 HTML，本项目生成的正文已经使用内联样式，适合在公众号编辑器中保留排版。

有两种方式：

1. **手动粘贴**：运行 `npm.cmd run wechat:render -- --issue=2026-w43`，然后在本机浏览器打开
   `data/wechat/render/2026-w43.html`，全选并复制，再粘贴到公众号后台编辑器。
2. **自动建草稿**：人工终审后切到 `draft_only`，运行 `wechat:sync-draft`。程序直接把同一份
   HTML 发送到微信 `draft/add`，不需要“阅读原文”网页。

`WECHAT_ARTICLE_SOURCE_URL` 只控制文末“阅读原文”跳转，属于可选配置。留空时不会提交
`content_source_url`，正文仍会完整进入公众号草稿。

## 首次部署

1. 在公众号后台确认 `draft/add`、`freepublish/submit`、`freepublish/get` 和永久素材接口是否可用。
2. 在公众平台配置服务器出口 IP 白名单。云函数的动态出口 IP 不稳定，建议使用固定出口 IP 的 worker 或代理。
3. 将 `.env.example` 复制为本地 `.env.local`，填入 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。密钥只放在服务端。命令行脚本会读取 `.env.local`，已存在的系统环境变量优先。
4. `WECHAT_ARTICLE_SOURCE_URL` 可留空。只有希望“阅读原文”跳到公开网页时，才设置
   `https://your-domain.com/weekly/{issueKey}` 这类模板。
5. 先保持 `WECHAT_PUBLISH_MODE=dry_run`，执行 `npm.cmd run wechat:check` 和 `npm.cmd run wechat:render -- --issue=2026-w43`。
6. 审核通过后再切到 `draft_only`，验证草稿箱和手机预览。
7. 确认接口权限后切到 `auto_publish`。本机 Windows 计划任务不需要 cron secret；
   只有从外部 HTTP 调度器调用受保护接口时才配置它。

生产部署不要把本地 `data/wechat/delivery` 当作唯一状态存储。当前文件存储适合本地和常驻服务器；Vercel serverless 需要把审批、`media_id`、`publish_id`、错误和幂等状态迁移到 Postgres/KV。

## 环境变量

```dotenv
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_AUTHOR=观澜 ESG Compass
WECHAT_ARTICLE_SOURCE_URL=
WECHAT_PUBLISH_MODE=dry_run
WECHAT_CRON_SECRET=
CRON_SECRET=
WECHAT_CALLBACK_TOKEN=
```

`WECHAT_PUBLISH_MODE`：

- `dry_run`：只校验和模拟，不调用微信。
- `draft_only`：调用微信创建草稿，不自动发表。
- `auto_publish`：到点调用 `freepublish/submit`，并轮询状态。

## 管理与 cron 接口

所有接口使用现有管理员会话；如配置了 cron secret，定时接口也接受
`Authorization: Bearer <WECHAT_CRON_SECRET>`、`Authorization: Bearer <CRON_SECRET>`
或 `x-cron-secret`。Vercel Cron 会自动发送 `Authorization: Bearer $CRON_SECRET`，
外部调度器可使用 `WECHAT_CRON_SECRET`。本机计划任务直接执行 CLI，不经过这些 HTTP 接口。

### 审核和状态

```text
GET  /api/wechat/weekly/:issue/readiness
POST /api/wechat/weekly/:issue/approve
POST /api/wechat/weekly/:issue/sync-draft
GET  /api/wechat/weekly/:issue/status
POST /api/wechat/weekly/:issue/retry
POST /api/wechat/weekly/:issue/refresh-status
```

审批请求：

```json
{
  "reviewer": "审核人姓名",
  "contentHash": "readiness 接口返回的内容哈希"
}
```

### 定时任务

```text
POST /api/wechat/prepare-due   # 创建到期周报的微信草稿
POST /api/wechat/publish-due   # 只发表已审批且已同步的到期周报
```

两个接口也支持 GET，供 Vercel Cron 使用。仓库的 `vercel.json` 已配置：

- 北京时间周一 07:45：`45 23 * * 0`
- 北京时间周一 08:00：`0 0 * * 1`

如果使用外部 cron，建议用同一时间并在请求头中带 `Authorization: Bearer $WECHAT_CRON_SECRET`。

## 本机 Windows 定时任务

当前的文件状态后端适合在本机常驻运行。管理员完成 `2026-w43` 的人工终审并填好
`.env.local` 后，可以注册一个每周一执行的 Windows 计划任务：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\wechat\install-scheduled-tasks.ps1
```

计划任务会在每周一北京时间 `07:45`、`08:00`、`08:10`、`08:20`、`08:30`
执行同一个幂等任务：

1. 如果内容已审批但尚未上传，创建微信草稿并保存 `media_id`。
2. 到计划发布时间后提交发表并保存 `publish_id`。
3. 后续触发只查询发表状态，不会重复创建草稿或重复提交。

每次执行的输出保存在 `data/wechat/logs/`。任务以当前 Windows 用户身份运行，计算机需在
触发时保持开机且用户已登录；错过触发后系统会尝试补跑，但 `publishDue` 仍只处理计划时间后
180 分钟内的任务。

手动预演：

```powershell
npm.cmd run wechat:run-due -- --dry-run
```

移除计划任务：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\wechat\uninstall-scheduled-tasks.ps1
```

## 发布控制台与首次测试顺序

管理入口：`/ops/wechat`。页面会显示审批状态、内容哈希、阻塞项、`media_id`、
`publish_id`、最近错误和审计记录。

首次接入严格按以下顺序执行：

1. `wechat:render`：检查标题、摘要、正文长度和内联样式。
2. `wechat:check`：确认凭据、封面和当前发布模式；原文链接与 cron secret 仅为可选能力。
3. 在 `/ops/wechat` 核对正文与来源，填写审核人并执行人工终审。
4. 在控制台执行 dry-run，确认没有调用微信接口。
5. 将 `WECHAT_PUBLISH_MODE` 改为 `draft_only`，同步微信草稿。
6. 在公众号后台检查手机预览、封面、正文排版和留言设置；只有配置了原文链接时才检查跳转。
7. 确认无误后再改为 `auto_publish`，由 07:45/08:00 的 cron 接管。

`publish_id` 只表示提交已受理，不代表文章已经发表。最终状态必须以
`freepublish/get` 返回的 `publish_status` 为准；系统只在状态为 `0` 时标记已发表。

## 命令行排障

```powershell
npm.cmd run wechat:check
npm.cmd run wechat:status -- --issue=2026-w43
npm.cmd run wechat:render -- --issue=2026-w43
npm.cmd run wechat:sync-draft -- --issue=2026-w43 --dry-run
npm.cmd run wechat:prepare-due -- --dry-run
npm.cmd run wechat:publish-due -- --dry-run
npm.cmd run wechat:run-due -- --dry-run
```

真实发布前，至少确认 `wechat:render` 返回 `valid: true`，且公众号后台的手机预览、封面、正文排版和留言设置都正常。
