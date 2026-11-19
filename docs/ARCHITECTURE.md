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

`lib/roundup-policy.ts` 定义周期性多事件汇编的统一标题识别规则。采集预筛在评分和聚簇前将其 `BLOCK`，公开层 `isFeedEligible` 再次拦截历史或异常漏网内容；内容运营选题默认复用同一规则。该规则只排除汇编，不排除报道单一新增事实的二手来源。

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

## 9. 气候风险实验室技术方案

2026-11-18实施基线：[CLIMATE_LAB_TECHNICAL_PLAN.md](CLIMATE_LAB_TECHNICAL_PLAN.md)。阶段A已用独立纯计算层取代统一乘数/价值指数，支持IPCC、IEA和NGFS目录切换；B/C数据接入和监控未完成。下列9.1—9.6为历史原型设计记录，与新方案冲突处以新方案为准，不能作为当前已交付能力说明。

情景来源由lib/climate-lab-model.ts逐条维护：officialQuote、quoteTranslation、sourceUrl、sourceTitle、sourceSection、application、verifiedAt。中文description为编辑释义，不是官方中文原文。组件默认只显示释义；原文和适用说明用路径key控制的原生details按需展开。逐源限制短引总量，源信息与机构版本共同更新；核对日期不表示自动监控时间。

阶段B增量：scripts/climate/collect-heat.ts离线按四并发读取NASA THREDDS点位CSV，逐日校验日期、单位、有效值和网格，保存data/climate/evidence及清单，全部成功后原子替换heat-snapshot.json。lib/climate-heat.ts负责严格计数和同网格时间窗比较。GET /api/v1/public/climate-risk只读本地快照，无外部请求、坐标外传或自动下载。components/ClimateHeatPanel.tsx处理加载、可用、缺覆盖和服务失败，旧请求用AbortController取消。复用公共API的CORS与限流。原始证据仅供离线复算，不进入客户端包；独立verify脚本检查哈希和用K>308.15复算日数。当前只覆盖两网格、三SSP、一个未来窗口、一个模型成员。

阶段B实际验收状态补充：上述两网格/三SSP为采集目标，当前仅上海ssp126/ssp245两条完整窗口；81份原始证据已保留。NASA503后启用熔断，不再等待所有目标完成才保留有效成果，而是按完整40年组合原子发布并保留历史组合。collection-status.json记录部分覆盖；verify --require-full保留完整阶段验收门槛。next.config.ts显式携带派生JSON，排除原始CSV；不将部分预览宣称为完整接入。

### 9.1 当前原型

2026-11-18案例增量：`sortClimateRiskCases`接受null风险表示全库，仍执行滚动五年及未来排除；默认全风险，支持当前风险及类型、排序筛选，客户端每次展示6条。风险枚举新增storm，避免龙卷风/强风误标降雨或海平面上升。人工库19条；新增记录保存sourceLocator/verifiedAt，datePrecision控制显示精度。月份/年度日期用于归一化排序，不表达具体灾害日。此静态索引不是已上线的自动采集管线。

持续研究采用对话自动化`esg-compass-3`每周三10:00检索，优先企业/监管申报及公开CDP；核验后修订原事件，不自动推送部署、不自动启用新信源。该任务依赖本地Codex调度环境。

后续披露底稿设计见[研究与披露方案](CLIMATE_MARKET_AND_DISCLOSURE_REVIEW.md)及技术方案阶段D，尚未实现。`reportContext/assessment/scenarioRuns/inputs/results/evidence/review`形成独立版本化契约；计算函数确定性运行，AI仅组织有证据的内容。首期本地导出Markdown/CSV/JSON，企业资料不写公开API或日志。修改输入使旧复核失效，按标准版本记录条款缺口，不以完整性分数代替合规判断。

跨市场研究索引位于`data/research/climate-disclosure-benchmarks.json`，每条标明section-read / selected-pdf-pages / indexed-excerpt，保留来源、定位、版本年度、局限及可用时的文件哈希。它是只读研究材料，不进入公开事件API/资讯时间线。后续底稿按[实施规格](CLIMATE_DISCLOSURE_WORKPAPER_SPEC.md)增加metricKind、effectStatus、affectedParty、periodBasis、denominator、managementCase、costBoundary及changeRecord；导出器与计算层先确定性实现，LLM为可选文字整理，不能自行补造输入。首期不接预期损失或估值模型。

`components/ClimateRiskLab.tsx` 作为独立路由 `/climate-lab` 的客户端解释层，使用一个虚拟项目、坐标/地图点选、分析半径、五类风险和静态示意系数验证交互。来源基准、用户压力测试偏移和资产参数分层维护；客户端公开危险度与经营冲击公式，但不把示意计算包装成事实 API 或科学模型。物理风险与转型风险分别维护 SSP 和 NGFS 情景状态，避免错误映射。

界面核心问题标题固定为“气候风险如何进入财务报表？”。“虚拟项目”属于输入状态与模型边界，不进入问题标题，避免将工具形态误表达为用户目标。

`lib/climate-risk-cases.ts` 保存原型阶段经人工核验的一手企业案例，字段包含事件日、风险标签、量化影响、影响等级、相关性和证据标签。该文件是过渡样本，不代替后续滚动五年采集管线。

`components/HomeClient.tsx` 在内容类型筛选栏最右侧提供烧瓶标识和“进入实验室”入口，指向 `/climate-lab`，不渲染独立 Banner。知识专区保持纯监管指南列表；`/zones/climate-risk` 保留原有世界地图、监管里程碑与法规内容。旧路由 `/zones/climate-lab` 通过 Next.js `redirect()` 兼容跳转。

### 9.2 生产数据架构

```text
NASA / IPCC / WRI / NGFS adapters
                 |
                 v
source manifest + license gate
                 |
                 v
normalize variables / scenario / units / grid
                 |
                 v
precompute point & regional statistics
                 |
                 v
versioned scenario cube + provenance
                 |
          +------+------+
          |             |
          v             v
lightweight JSON    vector/raster tiles
          |             |
          +------+------+
                 v
ClimateRiskLab + explainable factor engine
                 ^
                 |
company filings / official releases / regulators
                 |
five-year case collector -> evidence gate -> case index
```

生产适配器优先级：

1. NASA POWER Projection API 或 NEX-GDDP-CMIP6：温度、降水及极端指标的点位/网格投影。
2. NASA/IPCC AR6 海平面工具：区域相对海平面投影。
3. WRI Aqueduct：水压力、洪水及相关开放指标，遵守 CC BY 4.0 归属要求。
4. NGFS Phase V：碳价、能源、宏观金融和转型路径。接入时显示版本及已知数据质量说明。
5. IEA：首期只引用可公开的情景叙事；取得适当许可后才能接入或再分发数据。

### 9.3 标准化情景立方体

服务端统一写入以下字段：

- `locationId`、经纬度或区域编码。
- `riskType`、`variable`、`unit` 和统计口径。
- `baselineStart`、`baselineEnd`、`horizonStart`、`horizonEnd`。
- `scenarioFamily`（`SSP` 或 `NGFS`）与 `scenarioId`。
- `p10`、`median`、`p90`；不适用时记录原始统计量。
- `source`、`dataset`、`version`、`spatialResolution`、`generatedAt` 和许可标识。

情景族是强约束：物理变量只接受 SSP/对应气候模型情景，转型变量只接受 NGFS 等经济转型情景。若未来需要跨情景组合，应通过显式的 `scenarioBundle` 配置并记录依据，不能按名称或温升自动拼接。

### 9.4 计算、缓存与接口

- 原始 NetCDF/GeoTIFF 只在离线任务中处理，浏览器不直接下载。
- 点位请求按约 25 公里栅格返回时必须标注“非厂界测量”；区域聚合保留面积加权方法。
- 客户端只提交点位、分析半径和显式假设；来源基准数据不可被用户输入覆盖。压力测试偏移必须单独存储并可一键恢复。
- 缓存键至少包含数据集版本、变量、情景、时间窗、统计量和空间索引。
- 首期接口建议为 `GET /api/v1/public/climate-risk?locationId=&riskType=&scenario=&horizon=`，返回指标、区间、来源和用途声明。
- 计算层按 `hazardIndex = scenario × horizon × stressOffset` 和 `operatingImpact = hazardIndex × exposure × vulnerability × (1 - protection)` 输出中间值；参数名称、单位、默认值、版本和公式必须随结果返回。
- 企业案例采用独立滚动五年索引，采集优先级为公司年报/公告、证券监管申报、执法机构材料，再补充可回溯的一手公共材料。案例不得仅凭关键词自动公开。
- 案例索引至少包含 `occurredAt`、`companyId`、`riskTypes`、`impactAmount`、`impactCurrency`、`impactMetric`、`impactLevel`、`relevanceScore`、`evidenceType`、`attributionStatus` 和 `sourceUrl`。
- 默认排序依次使用风险相关性、影响等级、事件时间；“影响排序”使用编辑分档和相对重要性，禁止未统一口径的跨币种名义金额直接比较。
- `attributionStatus` 区分 `hazard-impact`、`climate-consistent` 和 `attributed`；只有权威归因研究支持时才能使用 `attributed`。
- 价值敏感性使用可解释参数桥接；默认只输出指数或区间，不输出货币损失。用户提供经授权的财务参数后，才可在后续受控模块中计算敏感性。

### 9.5 交付阶段

1. **透明交互原型（已完成）**：验证虚拟点位、可调假设、公开公式、响应式布局、风险传导和两套情景切换。
2. **滚动五年案例库**：把人工样本迁入采集、证据核验、影响分档、归因标记和版本化索引。
3. **真实点位数据**：接入一项物理数据源和 NGFS 转型数据，完成版本、缓存、区间及溯源。
4. **资产位置输入**：支持单点搜索；只有空间方法和许可验证后才接受少量 GeoJSON，不建设企业档案或资产组合管理。
5. **财务敏感性**：引入行业/资产类型参数与会计影响规则，保留人工确认和审计轨迹。
6. **规模化 GIS**：只有在真实使用和性能指标验证后，才评估厂界绘制、矢量瓦片、多资产组合和批量分析。

### 9.6 风险控制

- 科学风险：展示模型集合与区间，禁止确定性语言。
- 方法学风险：物理与转型情景分离；跨模型组合需显式版本化。
- 归因风险：灾害事件、企业影响和气候变化归因分层记录，禁止由事件影响反推气候归因。
- 许可风险：源清单配置许可与再分发权限，构建阶段阻止未授权数据发布。
- 会计风险：所有输出定位为影响解释和敏感性，不形成估值、审计或减值结论。
- 产品复杂度：实验室使用首页子栏目入口与独立页面，不进入顶级导航，不增加独立工作台、企业档案或预警中心。

## 10. 事项进展（2026-11-19）

新增可选人工维护快照 `data/publication/event-progress.json`（version 1），以稳定事项 id、明确 zoneIds 及 contentId 关联阶段、变化、自查问题和实际事件日期。原新闻正文、来源、报道日期仍从 contents.json 解析；不复制正文，不修改新闻标题或日期，不依据 storyId/sourceRefs 自动生成节点。

`publication-store.readEventProgress` 使用现有文件缓存并以 unknown 返回；`event-progress.resolveProgress` 执行结构、日期、公开资格、重复和事项冲突过滤；`event-progress-store` 提供事件与专区共用查询。缺失快照或未知版本不显示模块。常规 publication bundle 不覆盖此文件。

事件详情服务端读取事项，`EventProgress` 以原生 details 实现最近三条及展开更早节点，单节点仅显示摘要与证据；相关报道与热度趋势折叠，不显示同议题法规推荐。详情及页面元数据执行 isFeedEligible。专区服务端读取显式 zoneIds 关联，默认五项，链接最新有效节点的详情锚点。首页组件、排序、collapseByStory 和采集评分均不调整，公开 API 契约保持不变。

初始两个事项各一条记录，不声称完整历史或实时法律核验。进展结构、编辑维护规则、验收和后续边界见 `EVENT_PROGRESS_TECHNICAL_PLAN.md`。

### 10.1 移除事件泛法规关联

删除 `getRegulationsForEvent` 及详情渲染调用，避免将专区关键词候选误作事件直接关联；`getRegulationsForZone` 继续仅供知识专区主题聚合。没有新增采集任务、数据契约或公开 API。产品地图同步去除事件法规推荐描述。未来如建立事件法规引用，需独立核验具体条款／适用义务及证据位置，不能重新以关键词或 storyId 回退填充；该能力本批未实现。
