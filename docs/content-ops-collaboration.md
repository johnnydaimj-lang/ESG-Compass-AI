# 双员工内容协同：内容筛选者与内容加工者

版本：v2  
目标：员工 1 号让注意力聚焦，员工 2 号把真正值得解释的问题加工成有证据、有观点的深度文章，Johnny 保留人工判断和发布责任。

## 1. 角色与不可外包节点

### 员工 1 号：内容筛选者

职责：

- 持续维护 ESG Compass 的产品内容、来源、聚类、热度和趋势信息。
- 从海量信息中筛出值得关注的动态，帮助读者建立趋势感。
- 维护产品内容质量和本地只读索引。
- 让员工 2 号能够直接、快速读取产品内容，而不必重复抓取网页。
- 记录 Johnny 的选题否决、事实纠错和润色反馈，用于优化筛选。

不负责：

- 不代替 Johnny 决定最终选题。
- 不把产品摘要当作最终事实。
- 不写最终发布稿。
- 不调用微信发布接口。

### 员工 2 号：内容加工者

职责：

- 直接读取 ESG Compass 产品内容，自主寻找争议点、案例、热点和政策/研究分析题目。
- 每轮提出 2-3 个深度选题候选。
- 在 Johnny 选题后补充一手证据，完成研究、大纲、初稿和自检。
- 将有判断、有证据边界、有未解决问题清单的候选稿交给 Johnny。

不负责：

- 不把周报汇总直接扩写成深度文章。
- 不自行批准选题或发布。
- 不把产品摘要、编辑标签或热度当成公开事实。
- 不操作微信凭据和真实发布接口。

### Johnny：主编与发布责任人

不可外包的节点：

1. 从候选短名单中确定最终选题和文章类型。
2. 润色标题、导语、观点和敏感措辞。
3. 对关键事实、合规边界和最终版本做终审。
4. 明确批准或拒绝发布。

## 2. 新的信息流

```text
ESG Compass 产品抓取、聚类和趋势索引
                  |
                  | 直接本地只读
                  v
        员工 2 号自主浏览和选题
                  |
                  v
       topics/ 候选短名单（2-3 个）
                  |
                  v
            Johnny 选择题目
                  |
                  v
  drafts/ 研究、来源矩阵、大纲、初稿、自检
                  |
                  v
       reviews/ 交 Johnny 润色与终审
                  |
                  v
        既有审批与微信公众号发布链路
```

员工 2 号不再消费 `data/content-ops/signals/`。该目录保留为旧版历史归档；W43 已人工发布，
不进入新选题队列。

## 3. 三条公众号内容线

| 内容线 | 目的 | 频率 | 责任边界 |
| --- | --- | --- | --- |
| 周报 | 定期更新，维持运营节奏 | 固定周期 | 既有周报制作和发布链路；员工 2 号不把周报扩写为深度稿 |
| 热点与争议 | 抓住传播窗口，提供有依据的观点 | 有机会时 | 公平呈现多方材料，区分事件、指控、调查、裁决和处罚 |
| 专业研究 | 分析政策、报告、数据和机制 | 稳定输出 | 必须有观点和机制，不得只是摘要或条文复述 |

“爆款”是传播目标，不是事实标准。争议选题不能用没有证据的指控换取点击。

## 4. 员工 2 号的本地读取

工作目录：

```text
D:\学习\ESG智能体\ESG Compass AI\ESG Compass_v2
```

产品读取命令：

```powershell
npm.cmd run contentops:product-read -- --days=30 --limit=40 --format=json
```

人类可读版本：

```powershell
npm.cmd run contentops:product-read -- --days=30 --limit=40 --format=markdown
```

可选筛选：

```powershell
npm.cmd run contentops:product-read -- --days=30 --limit=20 --query=诉讼 --min-score=70
npm.cmd run contentops:product-read -- --days=30 --limit=20 --content-type=政策,学术
```

规则：

- 默认排除周报汇总。
- `--include-weekly` 只在 Johnny 明确要求时使用。
- 产品摘要只是选题线索，进入研究后必须打开原文。
- 读取命令不修改产品数据，不读取微信凭据。
- 旧命令 `contentops:read` 不属于新链路。

## 5. 共享工作区

```text
data/content-ops/
  topics/         员工 2 号写候选，Johnny 在这里选题
  drafts/         员工 2 号写研究包和初稿
  reviews/        员工 2 号交给 Johnny 的待审稿
  published/      Johnny 确认发布后的记录
  board.md        轻量状态看板
  signals/        旧版历史归档，不进入员工 2 号默认输入
  state/          旧版游标归档，新链路不使用
```

共享文件是工作交接的真相来源。聊天消息只用于提醒，不替代 `topics/`、`drafts/` 和
`reviews/` 中的文件。

## 6. 交接协议

### 6.1 候选交接

员工 2 号每轮写 2-3 个候选：

```text
data/content-ops/topics/{candidateKey}.json
```

每个候选必须有：

- `editorialLine=hotspot|research`
- `productItemIds`
- `storyIds`
- `sourceUrls`
- `eventFact`
- `controversy`
- `thesis`
- `whyNow`
- `targetReader`
- `evidenceAvailable`
- `evidenceGaps`
- `riskLevel`
- `scores`

候选状态先写 `shortlisted`。只有 Johnny 明确选择后，才进入正式研究。

### 6.2 研究交接

Johnny 选题后，员工 2 号建立：

```text
data/content-ops/drafts/{candidateKey}/
  01-research.md
  02-source-map.json
  03-outline.md
  04-draft-v1.md
  05-self-check.md
  06-open-issues.md
```

核心事实至少有一个 A 级来源。争议文章必须补齐多方材料。研究报告必须说明方法和边界。

### 6.3 审核交接

员工 2 号把待审稿写入：

```text
data/content-ops/reviews/{candidateKey}/
  README.md
  draft-final-candidate.md
  source-map.json
  fact-check.md
  open-issues.md
```

`README.md` 只汇报：

1. 核心判断。
2. 为什么现在值得写。
3. 已核实的关键事实。
4. 未解决的事实、合规、名誉或措辞风险。
5. Johnny 需要做的具体决定。

### 6.4 发布交接

只有 Johnny 明确批准后，才有资格进入现有微信公众号发布链路。

发布前的任何标题、正文、来源、摘要、封面或计划时间变化，都必须重新审批。发布自动化
不能修改核心观点，也不能跳过内容哈希校验。

## 7. 选题评分与停止条件

总分 100 分，低于 70 分不进入正式研究：

- 时机性 20
- 读者相关性 20
- 信息增量 20
- 角度独特性 15
- 证据可得性 15
- 可行动性 10

出现以下任一情况必须停止并升级给 Johnny：

- 关键事实只有 C 级来源。
- 一手来源与产品摘要或二手报道冲突。
- 政策阶段、数字口径或地域范围无法确认。
- 标题只有通过夸大冲突才能成立。
- 选题涉及未披露的法律、商业、隐私或声誉风险。
- 文章需要预设贬低中国或抹黑中国制度/政策的立场才能成立。

## 8. 自动化边界

可以自动化：

- 扫描产品内容、聚类、热度和趋势索引。
- 生成员工 2 号的只读选题扫描结果。
- 检查候选 JSON、来源完整性和引用格式。
- 生成研究提纲草稿和自检清单。

不能自动跳过：

- Johnny 的最终选题。
- 关键事实和争议阶段核对。
- 标题、导语、观点强度与正文证据的一致性确认。
- 名誉、隐私、政治和平台合规审阅。
- Johnny 的润色、终审和发布批准。
- 真实微信发表或群发。

## 9. 每周节奏

| 时间 | 动作 | 责任 |
| --- | --- | --- |
| 周一 08:00 | 公众号周报按既定流程发布 | 人工审批 + 既有发布链路 |
| 周一 | 员工 2 号扫描最近 30 天产品内容，提出 2-3 个深度候选 | 员工 2 号 |
| 周二前 | 选题定型，确认文章类型和核心判断 | Johnny |
| 周二至周三 | 研究、来源矩阵、判断链大纲 | 员工 2 号 |
| 周四 | 初稿、自检、风险清单 | 员工 2 号 |
| 周五前 | 润色、终审、决定是否进入发布链路 | Johnny |
| 发布后 | 记录修正、表现和选题反馈 | Johnny + 两个员工 |

如果某周没有达到证据门槛，宁可延期，不以数量为由降低核查标准。

## 10. 常用入口

```powershell
# 员工 2 号浏览产品内容
npm.cmd run contentops:product-read -- --days=30 --limit=40 --format=json

# 校验旧版历史信号归档，不用于员工 2 号新选题
npm.cmd run contentops:validate
```

可直接交给另一个智能体的任务书见 [员工 2 号启动任务书](employee-2-bootstrap-prompt.md)，
完整规范见 [员工 2 号任务书](employee-2-task-brief.md)。
