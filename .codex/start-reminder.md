# ESG Compass — 待办提醒

## 上次未完成（待开始）
1. **增强检索（AI 检索）** — rm-ai-search
   基于知识库的语义检索，支持自然语言提问，结果附带来源引用
2. **知识库建设** — rm-knowledge-base
   政策全文库 / 框架标准库（SASB/GRI/ISSB/TCFD）/ 事件知识单元沉淀 / 向量化索引 + Obsidian 同步
3. **ESG 专区 CRUD** — rm-zone-crud
   支持新建/编辑/删除专区及关联事件

## 已在本轮完成的
- ✅ 修复 hydration 不匹配（HomeClient suppressHydrationWarning）
- ✅ KB 条目 sourceUrl 指向更具体的页面而不是根域名
- ✅ 产品说明更新至 v4

## 已完成功能总览
- [x] ESG 快讯时间轴（分类 Tab + 精选切换 + 20 条截止 + 展示更多）
- [x] 事件详情页（推荐理由 + 所属专区 + 相关法规与标准）
- [x] ESG 专区建设：8 个专区（含劳工与人权/绿色金融/气候风险/生物多样性/ESG 活动）
- [x] 精选推荐理由（LLM-as-Judge + 三维度权重）
- [x] AI 问答 /chat
- [x] 个人工作台 /workbench（密码保护）
- [x] 运营看板 /ops（信源状态 + 管道概览 + 异常日志 + 路线图）
- [x] AI 草稿审核 /review
- [x] 知识库 /kb（10 条条目，分类筛选 + 关键词搜索）
- [x] 数据管道 scripts/pipeline.mjs（RSS 抓取 + ESG 过滤 + DeepSeek 结构化）
- [x] GitHub Actions 自动化（周一/五 08:00 定时触发 + 手动触发）
- [x] 8 个信源配置（欧盟/SEC/MAS 等）
- [x] 代码推送至 GitHub + Vercel 部署

## 上次操作注意事项
- 代码已推至 GitHub，Vercel 自动部署
- 本地 dev server 在 http://localhost:3000
- Vercel 部署: https://esg-compass-ai.vercel.app

## 如何访问提醒
当前提醒位于 `.codex/start-reminder.md`，Codex 启动时自动扫描。也可在 /ops 后台查看功能路线图面板。
