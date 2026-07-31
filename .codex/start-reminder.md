# ESG Compass — 待办提醒

## 上次未完成（待开始/进行中）
1. **专区内容增强** — rm-zone-expand
   支持后台配置新增/编辑/删除专区及关联事件；详情页已能聚合 mock + 真实内容
2. **数据管道优化（进行中）** — rm-pipeline-optimize
   质量门禁 + 启发式精选已上线；继续提升信源覆盖与稳定性、LLM 结构化质量
3. **知识库内容增强（并入专区后）** — rm-kb-to-zone
   扩展法规/标准条目覆盖面，增加全文展开
4. **市场调研** — rm-market-research
   AI Agent 前沿动态 + 双碳/ESG SaaS 产品形态分析

## 已在本轮完成的
- ✅ 数据管道质量门禁：导航垃圾/非 ESG 过滤
- ✅ 启发式精选：三维度 + 选题价值，存量 99→33 条，精选 8 条
- ✅ 运营看板真实精选统计 + passedQuality/filteredQuality
- ✅ 专区关联事件打通：mock + 真实内容按关键词聚合

## 已完成功能总览
- [x] ESG 快讯时间轴（分类 Tab + 精选切换 + 20 条截止 + 展示更多）
- [x] 事件详情页（推荐理由 + Policy Impact Card + 专区关联 + 法规标准）
- [x] 8 个知识专区（里程碑 + 关联事件 + 法规标准）
- [x] 精选推荐理由（LLM-as-Judge + 三维度权重 + 选题价值）
- [x] 个人工作台 /workbench（密码保护）
- [x] 运营看板 /ops（信源状态 + 管道概览 + 异常日志 + 路线图）
- [x] 数据管道 scripts/pipeline.mjs（质量门禁 + RSS 抓取 + 结构化 + 精选）
- [x] GitHub Actions 自动化（周一/五 08:00 定时触发 + 手动触发）

## 上次操作注意事项
- 本地 dev server: http://localhost:3000
- Vercel 部署: https://esg-compass-ai.vercel.app
- 未推送代码时，最新改动仅在本地
