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

实时采集当前优先支持 RSS 适配器。其它网页、搜索和邮件适配器必须单独实现并通过 sourceRun 报告状态，不能伪造成功。

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
