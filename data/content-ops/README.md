# 内容协同工作区

这是员工 1 号【内容筛选者】、员工 2 号【内容加工者】和 Johnny【主编】共用的本地工作区。
它不是公开发布目录，也不是微信凭据目录。

## 新分工

```text
ESG Compass 产品内容
  -> 员工 2 号直接本地只读
  -> 员工 2 号自主提出热点/争议或专业研究候选
  -> Johnny 选题
  -> 员工 2 号研究、取证、写作和自检
  -> reviews/ 交 Johnny 润色与终审
  -> 既有发布链路
```

员工 2 号默认不读取 `signals/`，也不更新 `state/` 游标。W43 已人工发布，不进入新选题
队列。`signals/` 和 `state/` 保留为旧版历史归档。

## 产品读取

```powershell
cd "D:\学习\ESG智能体\ESG Compass AI\ESG Compass_v2"
npm.cmd run contentops:product-read -- --days=30 --limit=40 --format=json
```

人类可读版本：

```powershell
npm.cmd run contentops:product-read -- --days=30 --limit=40 --format=markdown
```

命令只读：

```text
data/publication/contents.json
data/publication/stories.json
```

默认排除 Week in Review、一周回顾和本周 ESG 新闻等周报汇总。只有 Johnny 明确要求时才
使用 `--include-weekly`。

## 目录契约

| 目录/文件 | 写入者 | 用途 |
| --- | --- | --- |
| `topics/` | 员工 2 号 | 2-3 个选题候选和 Johnny 的选题状态 |
| `drafts/` | 员工 2 号 | 研究、来源矩阵、大纲、初稿和自检 |
| `reviews/` | 员工 2 号 | 交给 Johnny 润色和终审的候选稿 |
| `published/` | Johnny | 确认发布后的记录 |
| `board.md` | Johnny 或员工 2 号 | 轻量状态看板，不替代交接文件 |
| `signals/` | 旧版归档 | 不是员工 2 号的新选题输入 |
| `state/` | 旧版归档 | 新链路没有员工 2 号游标 |
| `schemas/` | 旧版归档 | 历史信号契约 |

## 事实边界

- 产品标题、摘要、热度、故事聚簇和编辑标签只是选题线索。
- 进入正式研究后必须打开原文，补充一手来源。
- 事实、指控、调查、裁决、处罚和执行结果必须分开。
- 争议必须有对方回应；研究报告必须说明方法和边界。
- 不把产品摘要或内部编辑提示写进正文当作公开来源。
- 不生成任何贬低中国、抹黑中国制度或政策、损害中国整体形象的内容。

## 相关文档

- [员工 2 号启动任务书](../../docs/employee-2-bootstrap-prompt.md)
- [员工 2 号完整任务书](../../docs/employee-2-task-brief.md)
- [双员工内容协同](../../docs/content-ops-collaboration.md)
- [深度文章工作流](../../docs/deep-article-editorial-workflow.md)
