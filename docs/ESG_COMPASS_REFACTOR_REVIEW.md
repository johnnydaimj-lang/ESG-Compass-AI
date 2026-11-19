# Competitive Research Snapshot

## 1. Scope

**Company/product:** ESG Compass AI | **Category:** ESG专业信息筛选与事件解释 | **Decision supported:** 在保持轻量定位的前提下，选择值得复用的项目经验与渐进重构顺序 | **Competitors analyzed:** AIHOT、Miniflux、TrendRadar、RSSHub（均为参考对象，不等同直接商业竞品）

研究日期：2026-11-19。用户确认：同时服务“快速看重要事件”和“持续跟踪行业/议题”，并能举一反三，理解自身企业可检查或采取的行动；优先改善UI层级以及信源覆盖、重复与更新可靠性。

**Assumption｜待验证：** 默认阅读时间以现有PRD的三分钟为起点，重要性面向企业ESG、合规和研究人员。行业关注先通过筛选和可分享URL实现，不推导出个人工作台需求。

证据区分：**Fact**为代码、实测输出或原始文档可核查内容；**Inference**为面向Compass的设计判断；**Assumption**为试验目标或尚无用户验证的设想。没有安装运行四个外部项目，不背书其生产稳定性、性能或模型质量。项目版本、许可证、局限和本地统计见[研究快照](../data/research/refactor-reference-snapshot.json)。GitHub头部SHA来自当日API，已读文档为默认分支，不声称逐文件锁定到相同提交。

## 2. Competitor Snapshots

### Competitor: AIHOT

- **Positioning:** **Fact｜高** 数字生命卡兹克公开的行业热点站引擎，MIT许可；名称及Logo不在许可内。[仓库](https://github.com/KKKKhazix/AIHOT)
- **Relevant capability:** **Fact｜高** 文档单列信息增量、后续进展、代表报道、人工归属保护和同样本综述评测。[精选与校准](https://raw.githubusercontent.com/KKKKhazix/AIHOT/main/docs/selection.md)、[综述评测](https://raw.githubusercontent.com/KKKKhazix/AIHOT/main/docs/story-digest-evaluation.md)
- **Likely strength:** **Inference｜中高** 这些编辑流程与Compass接近，适合借鉴校准、证据和更正机制；本项目已经参考其分层，不需要重新实现基础流水线。
- **Likely weakness:** **Inference｜中** 当前仓库包含独立API/worker/web及工作区；整套迁入对现有Next.js发布快照架构成本较高。AI热点里的模糊事件合并偏好也不适合直接套到法规阶段。[package.json](https://raw.githubusercontent.com/KKKKhazix/AIHOT/main/package.json)
- **Key source URL:** [AIHOT](https://github.com/KKKKhazix/AIHOT)。未拿到生产信源、运营数据或实测性能，不把README的效果自述当作独立验证。

### Competitor: Miniflux

- **Positioning:** **Fact｜高** 简洁的订阅阅读器，Go/PostgreSQL技术体系，Apache-2.0许可。[仓库](https://github.com/miniflux/v2)
- **Relevant capability:** **Fact｜高** 支持订阅分类、搜索、链接规范化及多种阅读交互。[官方功能](https://miniflux.app/features.html)
- **Likely strength:** **Inference｜中** 有助于学习内容优先、低干扰浏览及按需展开，适合作为交互参考。
- **Likely weakness:** **Inference｜中高** 个人订阅收件箱并不提供Compass所需的ESG重要性判断；整套替换也会引入另一后端体系。
- **Key source URL:** [Miniflux功能页](https://miniflux.app/features.html)。借鉴交互模式，不默认加入未读数、账户和订阅管理。

### Competitor: TrendRadar

- **Positioning:** **Fact｜高** 聚合热点、RSS、AI筛选与多渠道通知的工具，GPL-3.0许可。[仓库](https://github.com/sansan0/TrendRadar)
- **Relevant capability:** **Fact｜中高** README更新记录包含RSS guid判重，分析范围和推送范围分开，以及新增内容通知等降噪安排。
- **Likely strength:** **Inference｜中** 可借鉴“完整采集分析、按增量呈现”，避免重复提醒和重复模型调用。
- **Likely weakness:** **Inference｜中高** 热榜排名与关键词热度无法单独表达ESG重大性；引入全部通知渠道和分析后台会扩大产品范围。
- **Key source URL:** [README与更新记录](https://github.com/sansan0/TrendRadar)。本轮不复用其源码或部署体系。

### Competitor: RSSHub

- **Positioning:** **Fact｜高** 面向多种网站的RSS路由项目，当前默认分支标注AGPL-3.0。[仓库](https://github.com/DIYgod/RSSHub)、[LICENSE](https://raw.githubusercontent.com/DIYgod/RSSHub/master/LICENSE)
- **Relevant capability:** **Fact｜高** 提供统一订阅通道及路由生态。[README](https://raw.githubusercontent.com/DIYgod/RSSHub/master/README.md)
- **Likely strength:** **Inference｜中** 对少数缺乏原生订阅的网站，可减少自行维护通用抓取适配器的工作。
- **Likely weakness:** **Inference｜中高** 未验证任何目标ESG路由；公共实例和上游网页变化仍可能失败，不能保证比原生RSS可靠。
- **Key source URL:** [RSSHub](https://github.com/DIYgod/RSSHub)。优先原始官方RSS/API，只对已验证缺口补通道；不将通道当作内容发布者。复制或集成代码前核对所用版本许可和集成方式。

## 3. Quick Comparison

| Dimension | ESG Compass | AIHOT | Miniflux | TrendRadar | RSSHub |
| --- | --- | --- | --- | --- | --- |
| Target customer | ESG/合规/研究人员 | 行业热点读者/站长 | 个人订阅阅读者 | 热点监测和通知用户 | 采集/订阅开发者 |
| Core use case | 重要ESG事件与企业启示 | 筛选、聚类和成刊 | 轻量阅读 | 监测、筛选及推送 | 网站转订阅 |
| Main strength | 已有专业提示词与公开质量门槛 | 编辑流程和校准 | 阅读简洁 | 增量与调度 | 适配器生态 |
| Main weakness | 日期、信源身份、进展代表稿仍有风险 | 整体迁入成本；行业方法需改写 | 不提供ESG判断 | 热度不等于重要性 | 不提供事实核验或推荐 |
| Evidence quality | 本地代码及只读测量 | 源文档与结构；未运行 | 官方文档；未运行 | README；未运行 | README及许可；未验路由 |

**Inference｜高：** 采用“现有Compass骨架＋有选择的能力借鉴”。目前没有足够证据支持整体换框架。UI与信源处理可以独立改进，不要求迁入四套系统。

## 4. So What?

**产品策略影响（三项）**

1. **Inference｜高：** 专业价值落在“发生了什么→为何重要→对哪些企业适用→应检查什么”，而不只是一段摘要。借鉴[Axios的变化/重要性先行](https://axioshq.com/smart-brevity)和[Semafor的事实与解释分层](https://www.semafor.com/article/11/06/2024/donald-trump-will-test-how-fragile-the-energy-transition-really-is)，具体建议必须仍有证据和适用条件。
2. **Inference｜高：** 将重要性、传播热度和个人/行业相关性分开。保持原ESG评分原则；传播少的一手监管更新不应被热榜压下去。[AIHOT热度方法](https://github.com/KKKKhazix/AIHOT)可参考，但不替代专业判断。
3. **Inference｜中高：** 首页突出阅读，持续跟踪依靠同一事件的进展；创新保留在解释和现有实验室入口，不增加首页大Banner或工具矩阵。[Carbon Brief](https://www.carbonbrief.org/about)的数据解释与事实核查方式可作专业内容参考。

**竞争/产品风险（两项）**

1. **Inference｜高：** 只借鉴简洁外观而保留错误日期、转载重复和主体混淆，会损害专业信任；增加信源数量无法自动修复这些问题。
2. **Inference｜中高：** 把聊天、预警、组合、知识库和报告工具都提升为首页任务，会削弱用户已确认的“快速看重点”目标。披露底稿和气候实验室继续独立迭代。

**产品机会（两项）**

1. **Inference｜高：** 复用故事聚类，让“新增进展”成为持续跟踪的核心，而非重新展示一组转载。
2. **Inference｜中高：** 在精选详情增加有适用条件的企业自查问题，将单个事件转化为可迁移的专业思考。不能从他企事件直接推定本企业同样受损或必须采取某项措施。

**待验证假设（三项）**

1. **Assumption：** 首页最多突出3–5条有依据的近期重点有助于三分钟阅读；数量不足不凑数。不能固定每日重写一条汇编充当事件。
2. **Assumption：** 用户通过轻量行业/议题筛选及保存URL即可完成多数跟踪任务，暂不需要个人账户。
3. **Assumption：** 影响对象、适用条件和一项自查问题能提升事件可用性；需请目标用户实际读案例并说明自己会做什么，不能以点击率替代验证。

## 附录 A：当前项目实际检查

**Fact｜本地快照，2026-11-19：** 1,998条发布记录，499条符合公开门槛，按现有故事规则折叠为426条，26条精选均有明确推荐理由；没有发现其推荐理由首句与摘要首句完全相同。该检查仅证明字段和字符串状态，不证明每条理由有洞见，也不等同独立事实核查。

现有[架构说明](ARCHITECTURE.md)和[第三方归属](../THIRD_PARTY_NOTICES.md)已经写明借鉴AIHOT。应保留采集/预筛/评分/理解/聚类/发布分层，以及公开页面只读发布快照的边界。

| 观察 | 证据 | 判断与优先级 |
| --- | --- | --- |
| 同一发布者只改通道，RSS得T1_5、网页得T2、API得T1 | `lib/pipeline/collect.ts:sourceTierFor`，纯函数探针复现 | **Fact**：身份与传输方式耦合；**Inference**：优先分开publisher/provenance与channel，避免通道变更影响专业可信度 |
| 空发布时间回退当前时间，RSS直接使用该值 | `collect.ts:toPublishedTimestamp/collectRssSource` | **Fact**：代码存在该路径；**Inference**：有旧文刷新的风险，未知日期应待核；未统计已有错误数量 |
| 聚类主要用14天窗口和词频余弦阈值 | `lib/pipeline/cluster.ts`、`text.ts` | **Fact**：尚无独立的阶段/事实增量判断；**Inference**：先补真实双语/新进展样本，再评估语义召回；不能据此宣称当前误合并率 |
| 故事折叠在同精选状态下优先最早发布稿 | `lib/feed-policy.ts:collapseByStory` | **Fact**：代表稿选择如此；**Inference**：新进展可见性需增强，原始事件日与最近实质进展分开 |
| 首页将全部符合条件的内容传入客户端再筛选 | `app/page.tsx`、`components/HomeClient.tsx` | **Fact**：499条本地未压缩JSON约930KB；**Inference**：分页和精简列表契约值得优先试验 |

初步30张卡片的精简投影约25.8KB，仅用于说明裁剪空间；不含完整筛选/热点元数据，不是实际RSC/HTTP大小，更不代表线上速度已提升。本次浏览器连接超时，未完成新的线上视觉与性能测量，UI判断来自组件代码。

## 附录 B：建议的最小产品形态

**Inference｜建议，未实施：**

- 主阅读流提供“重点/全部”的清楚切换，复用现有精选筛选；重点直接使用事件记录，不增加独立大区块。优先展示日期范围和最近有效更新。
- 保留“全部｜政策｜行业｜观点｜学术｜评级”和右侧实验室入口。地区/议题/行业放在一个按需展开的筛选区；行业字段覆盖不足时明确缺口，不能按关键词伪装精准行业匹配。
- 列表卡优先标题、一句变化、精选的一句重要性、来源及日期。数字分、趋势箭头和次要标签移入详情或说明；这只调整信息层级，不改变原评分和公开门槛。
- 详情用四个短问题组织：发生什么变化？影响谁及通过什么机制？哪些同类企业可借鉴？下一步核对什么及有哪些限制？普通资讯不强制生成行动要求。
- 同一事件保留稳定身份；转载折叠，提案/通过/生效、调查/裁决等不同阶段保留实质进展。来源数量不直接标成独立事实验证数量。
- “对同类企业的启示”写成有条件的检查方向；法律责任、处罚、研究因果和企业宣传分别表达证据阶段，不强行制造对立观点或伪平衡。
- 气候案例可按相关性链接到现有实验室帮助理解条件变化，但不由案例自动推算用户企业损失。

## 附录 C：渐进重构顺序与验收

| 批次 | 可交付范围 | 用户价值 / 成本 | 验收与停止条件 |
| --- | --- | --- | --- |
| 1 信源身份与时间 | 发布者身份、采集通道、原始/抓取日期分开，缺日期待核；原始有效值保留 | 专业信任高；成本中 | 同源切换通道不改变编辑等级；缺日期不变今日新闻；正常低频无更新与失败分开。涉及信源配置先审查，不自动启用候选源 |
| 2 首页减负 | 精选入口层级、精简卡片、按需筛选、分页列表契约 | 快速阅读高；成本低至中 | 390px无溢出，搜索/分类/月份可分享且语义不变；测真实响应与加载，不靠JSON估算宣称提速 |
| 3 事件与进展 | 来源文档→事实发生→持续故事分层；来源优先与最新实质变化协调 | 持续跟踪高；成本中 | 建立不少于30对人工标注样本：同文转载、中英同事、同名不同政策、同政策不同阶段、他企相似事件、旧文再报；逐类报告误并/漏并，不以总体准确率掩盖高风险误并 |
| 4 可迁移启示 | 精选事件的影响链、适用条件、来源及自查问题 | 专业洞见高；成本中 | 新旧提示词在同输入上盲评，禁止无依据事实、通用套话和强行行动要求；不批量重算全库或增加聊天入口 |

可并行做批次1的核验和批次2的静态原型；实际开发仍逐批验证后提交。首期继续使用当前Next.js和发布快照，不新增微服务、向量库、多Agent工作流或数据库迁移。只有数据增长、并发、检索质量实测证明瓶颈时，再评估相应基础设施。

量化评估应区分：抓取成功/正文可用/日期有效/近期覆盖、转载重复展示率、不同事实误合并率、已知重要事件集合的漏收率、用户是否能说明自身检查方向。点击数和内容总量不作为单独成功指标。

本轮仅研究、只读审计及提出方案；没有修改产品代码、评分规则、信源配置、PRD既定功能或线上部署。新方案采纳实施时再同步PRD、架构和对应验收。

## 后续可选产物

1. 对标行动卡：把可借鉴机制逐项对应到Compass文件和验收。
2. 管理层比较矩阵：集中比较收益、复杂度和迁移成本。
3. 未来两季度产品风险与机会：明确先后顺序和不做事项。
4. 验证假设的问题：用目标用户阅读任务检查界面和启示是否有用。
