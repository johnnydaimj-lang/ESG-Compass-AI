# 凭据与隐私保护

## 已经暴露的凭据

任何在聊天、邮件、工单或截图中出现过明文的 API 密钥都应视为已经泄露，不能继续使用。
微信 `AppSecret` 应立即在微信开发者平台重置；AppID 属于敏感标识，也不应继续传播。

新密钥只在本地 `.env.local` 中填写。不要把 `.env.local` 的内容粘贴到聊天、日志、文档或
Git 提交中。`AppSecret` 重置后，旧密钥会失效，不需要也不应该继续保存。

## 本地保护

敏感文件全部被 `.gitignore` 排除：

- `.env.local`
- `data/.admin-session-secret`
- `data/wechat/state/access-token.json`
- `data/wechat/logs/`
- `.codex-artifacts/`

在 Windows 上执行以下命令，将本机敏感文件的访问权限限制为当前用户：

```powershell
npm.cmd run security:protect
```

运行隐私扫描：

```powershell
npm.cmd run security:scan
```

扫描不会输出密钥值，只报告命中数量和文件路径。它检查受 Git 跟踪的文件、运行日志、
生成产物，以及敏感路径是否确实被忽略。

## 代码与日志约束

- 微信请求、服务状态、审计记录、命令行输出和计划任务日志统一经过敏感字段脱敏。
- `access_token` 缓存写入失败时采取失败关闭策略，不会降级为无保护的磁盘写入。
- 生产环境不再提供默认管理员密码，必须显式配置 `ADMIN_PASSWORD`。
- 提交前至少执行一次 `npm.cmd run security:scan`。

## 凭据轮换

1. 登录微信开发者平台，在公众号“基础信息 → 开发密钥”中重置 `AppSecret`。
2. 在同一位置配置服务器实际公网出口 IP 的 API 白名单。
3. 在本地 `.env.local` 中替换密钥，不通过聊天传递。
4. 保持 `WECHAT_PUBLISH_MODE=dry_run`。
5. 执行 `npm.cmd run security:protect`、`npm.cmd run security:scan` 和
   `npm.cmd run wechat:check`。
6. 只有最小化 token 验证返回成功、且 IP 白名单错误消失后，才进入草稿测试。
