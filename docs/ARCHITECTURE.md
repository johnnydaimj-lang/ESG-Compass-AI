# ESG Compass v2 架构说明

## 1. 参考边界

v2 借鉴 AIHOT 的分层方式，不复制其品牌、视觉和 AI 行业 Prompt。可复用的模式包括：

- 采集、预筛、评分、理解、聚簇、发布分层。
- 两类 Prompt 模板：变量和递归 include。
- 两次独立评分与双倍门槛。
- 材料身份和信源身份分离。
- 所有公开出口共享发布快照。
- 48 小时热度窗口、24 小时半衰期与独立参与方去重。
- 日报（daily report）的高亮、分节与跨来源故事分层。
- 首屏无闪烁的主题切换（`data-theme` + 内联引导脚本）。

第三方归属见 `THIRD_PARTY_NOTICES.md`。

## 2. 数据流

```text
source configs / snapshot
        |
        v
collect / normalize
        |
        v
prefilter (PASS | UNKNOWN | BLOCK)
        |
        +---- BLOCK --------------------+
        |                               |
        v                               |
dual scoring                            |
        |                               |
        v                               |
content understanding + structure       |
        |                               |
        v                               |
story clustering + heat                 |
        |                               |
        v                               |
publication bundle ---------------------+
        |
        +--> pages
        +--> ops API
        +--> controlled contents API
```

## 3. 身份规则

- 材料 `material.id` 标识一条抓取或快照记录。
- 信源 `sourceId` 标识产生材料的配置源。
- `StoryCluster.memberIds` 保存材料 ID。
- `StoryCluster.participants` 保存独立信源 ID。
- `HeatEvidence.sourceId` 保存真实信源 ID。

聚类和热度依赖这条边界。任何阶段都不得因为两者当前字符串相近而互换。

## 4. 发布契约

`lib/publication-store.ts` 是发布快照的统一读写层。

读取：

- `readPublishedContents()`
- `readStories()`
- `readHotspots()`
- `readDaily()`
- `readPipelineStatus()`

写入：

- `writePublicationBundle()`
- `writePublishedContents()`
- `writeDaily()`

旧 `data/contents.json` 只允许流水线快照适配器读取一次，不属于运行时公开事实源。

## 5. Prompt 运行时

实现位于 `lib/pipeline/prompt.ts`。

模板规则：

- `{{variable}}` 由调用方传入。
- `{{> partial}}` 递归插入 `partial.md`。

失败规则：

- 变量不存在：抛错。
- include 文件不存在：抛错并包含文件路径。
- include 循环：抛错并打印循环链。

版本规则：

- 收集入口文件及全部递归 include。
- 按名称排序。
- 哈希每个文件的名称和内容。

## 6. 流水线入口

`scripts/pipeline/run.ts` 负责：

1. 选择 snapshot 或 live 输入。
2. 关联材料与信源配置。
3. 执行确定性的预筛、评分、理解和结构化适配器。
4. 用真实信源 ID 构造聚类与热度证据。
5. 收集 warning、sourceRuns 和 promptVersions。
6. 生成日报并写入完整发布快照。

实时采集支持 RSS、网页、浏览器渲染及若干专用 API 适配器。其它搜索和邮件适配器必须单独实现并通过 sourceRun 报告状态，不能伪造成功。

### 6.1 信源降级编排

`lib/pipeline/source-fallback.ts` 将 `data/sources.json` 中的有序 `fallbacks` 转成独立运行配置，`scripts/pipeline/run.ts` 统一调度主通道与备用通道：

1. 主通道缺少环境变量时，若存在无需该凭据的备用通道，直接尝试备用通道。
2. 主通道抛错时按配置顺序尝试备用通道。
3. 主通道返回空集合时，仅在 `fallbackOnEmpty=true` 时降级，避免把正常的“近期无更新”误判为故障。
4. 备用材料沿用原信源 `sourceId`、名称和源地址，保持聚簇与热度的信源身份稳定；状态中的 `channel` 记录实际采集通道。
5. 成功降级写入 `fallbackUsed=true` 和原因；未成功则保留主通道状态及各备用通道的失败原因。

该机制不替代必要凭据：没有备用通道的 IMAP 邮件源仍应透明跳过，等待运营侧配置凭据。

### 6.2 企业事件最小实现

企业事件增强不引入新的前台模块或数据实体，复用现有 `ContentItem`、`StructuredFact`、故事聚簇和发布快照：

1. `data/sources.json` 保存已验证的企业行动与执法信源；官方 RSS/Atom 优先，并用 `keywords` 在采集端限制噪声。
2. `lib/pipeline/prefilter.ts` 通过 `STRONG_ESG_TERMS` 识别循环经济、水资源、污染、职业安全和极端天气等实质事件。
3. `lib/pipeline/classify.ts` 将企业行动与对具体企业的处罚、起诉、停工等统一归为“行业”，同时保留普遍适用监管规则的“政策”分类。
4. `prompts/content-understanding.md` 与 `prompts/selection-score.md` 要求保留企业主体、动作、规模和证据阶段，但不新增企业档案字段。
5. 聚簇、双评分和精选推荐理由沿用现有逻辑；`isFeedEligible` 额外确保中文标题与 20–300 字中文摘要后才公开。
6. `scripts/backfill-zh.ts` 将空缺或实际仍为英文的 `titleZh` / `summaryZh` 进入翻译队列；LLM 不可用时会显式进入公开翻译接口回退。

首个扩展信源为英国环境署官方 Atom，仅保留起诉、罚款、定罪、非法污染、环境整改承诺和许可暂停/撤销等明确执法事件。

## 7. 前台模块

- **日夜间主题**：`components/ThemeToggle.tsx` 提供浅色 / 跟随系统 / 深色三档；`app/layout.tsx` 注入内联脚本在首帧前写入 `data-theme`，`globals.css` 以 CSS 变量覆盖深色值。
- **当前热点**：首页顶部渲染 `readHotspots()` 的 48 小时热点条；热度逻辑在 `lib/pipeline/heat.ts`，跨来源故事由 `lib/pipeline/cluster.ts` 产出。少于两个独立参与方时显示空状态而非伪造热点。
- **日报总结**：`lib/pipeline/daily.ts` 从最新发布日的内容与多来源故事生成日报，写入 `data/publication/daily.json`，由 `/daily` 页面读取展示（高亮、分节、跨来源故事）。

## 8. 测试策略

- `tests/prompt.test.ts`：变量、include、循环、缺失文件、版本哈希。
- `tests/score.test.ts`：向下取整、双评分门槛、SIGNAL 排除。
- `tests/cluster.test.ts`：材料 ID、信源 ID、关系阈值。
- `tests/heat.test.ts`：窗口、独立信源、编辑信源门槛。
- `tests/publication-store.test.ts`：发布快照写入和旧文件隔离。
- `tests/enterprise-events.test.ts`：企业行动、企业执法事件、普遍适用政策和无关企业新闻的预筛与分类回归。
