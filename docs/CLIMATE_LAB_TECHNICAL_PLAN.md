# 气候风险实验室实施方案

决策日期：2026-11-18。状态：阶段A已实现；阶段B部分预览（上海两条SSP）已复算，两地点/多情景完整验收未通过，NASA服务503/超时阻碍剩余采集；阶段C未接入。本文件替代原型中情景乘数、统一脆弱度和价值指数的设计。

## 目标与交互

面向企业 ESG 和财务使用者，主路径为选择情景体系、路径、观察时间窗，再选择风险并调整经营假设。项目坐标、人员背景、适应措施和计算依据逐级展开；不新增首页 Banner、企业档案、组合管理或预警中心。

成功标准：用户能识别机构情景与个人假设的区别；每个数值可追溯；无当地数据时不出现当地危险度；所有金额量纲一致；移动端390px无横向溢出。

## 方法依据与企业参考

- IPCC AR6：危险度、暴露与脆弱度及响应共同形成风险。SSP是路径，IPCC并不是一个统一的厂址损失模型。https://www.ipcc.ch/report/ar6/wg1/chapter/atlas/
- CLIMADA：暴露、危险事件和经校准影响函数；概率或频率数据齐全后才能算年均预期损失。当前参考其分层架构，尚未运行CLIMADA引擎。https://climada-python.readthedocs.io/en/stable/user-guide/climada_engine_Impact.html
- IEA WEO 2025：首期CPS/STEPS/NZE，锁定版本，不把旧版APS混入本版；只引用公开叙事。报告、附录与数据产品分别审查再利用许可。https://www.iea.org/reports/world-energy-outlook-2025/overview-and-key-findings
- NGFS Phase V：首期选Net Zero 2050 / Delayed Transition / Current Policies。禁用受Kotz-Wenz撤稿影响的物理损失变量；其他变量单独审查，不扩大禁用范围。https://www.ngfs.net/en/publications-and-statistics/publications/ngfs-climate-scenarios-central-banks-and-supervisors-phase-v
- BASF 2025可持续报告：参考按重要厂址、物理风险、运输与供应链依赖、措施组织分析的方式；不复制企业系数。https://report.basf.com/2025/en/combined-managements-report/consolidated-sustainability-statement/environment/e1-climate-change.html
- BASF公开CDP答卷：用于风险、潜在财务影响、措施与机会的结构化证据；不把未来金额写成已实现损失。https://www.basf.com/global/en/investors/sustainable-investments/sustainability-ratings-and-rankings

三类情景可选，但不建立自动一一映射。IPCC支持物理风险，IEA/NGFS支持转型解释；定量路径未接入时切换只更新情景叙事，不改变用户假设。界面明确标记此状态。

每条路径的解释使用“官方原文短引+译文+基于原文的中文释义+Compass适用说明”。官网URL、文档标题、章节/检索定位、版本与核对日期逐条绑定；同一URL的英文短引合计不超过25词，完整定义通过原文链接阅读。IEA NZE2025解释注明暂时超调，IPCC SSP5-8.5解释注明很高排放；不同机构的净零路径不可互换。原文默认折叠，路径切换后折叠复位，经营输入保留。

物理风险选择20年气候窗口；转型分析首期选择2030或2050时间点，分别记忆。IEA首期不提供超出已选分析范围的2081–2100窗口。

## 阶段 A：透明条件敏感性（本次）

代码分层：lib/climate-lab-model.ts维护版本化情景目录和纯计算；components/ClimateRiskLab.tsx负责呈现；lib/climate-risk-cases.ts负责人工案例和滚动窗口。

删除任意湿度/降雨权重、统一情景乘数、假空间热区、未经校准的区间和价值指数。坐标仅是项目上下文，人员数据仅是暴露背景。物理风险分为洪水、高温、缺水、沿海、山火。

计算以用户输入为条件：

- 单次经营冲击（万元）= 停工天数 × 每日贡献毛利（万元/天）+ 修复支出（万元）。
- 措施后冲击 = 剩余停工天数 × 每日贡献毛利 + 修复支出。
- 单次差额 = 避免的停工损失 − 一次性适应投入；不等同全寿命NPV。
- 年度增量碳成本（元）= 适用体系排放（tCO2e/年）× (1 − 有效免费配额覆盖率) × 碳价差（元/tCO2e）。

暂不计算概率、年均损失、公允价值、伤亡、保险赔付或税后NPV。输入限制有限值、非负天数和成本，减少停工不超过原停工，碳价差允许负值。贡献毛利不等同收入。

## 阶段 B：一项真实物理指标

首批实施选择NASA THREDDS原始NEX-GDDP-CMIP6 v2.0点位CSV。POWER投影实测在两地点、多模型返回HTTP200但tasmax映射全为-999，且其支持的情景与原始NEX不同，故未作为有效数据源。替代路径已实测原始ACCESS-CM2/r1i1p1f1/tasmax有效；直接支持ssp126、ssp245、ssp585。

范围：上海31.23/121.47与鹿特丹51.92/4.48请求点；实际使用0.25°格点中心。1995–2014历史基准、2041–2060未来窗口；每期20个完整Gregorian年（含闰日），K转°C后严格>35°C计数，每年计数再取20年算术平均。阈值不自动转成停工天数。采用单模型，不能提供模型集合不确定性或把年际范围称作置信区间。基准是历史模拟，不是气象观测。

运行npm run climate:collect：四个worker、每请求90秒超时、普通失败最多3次尝试并退避；429/503立即熔断新增请求，复用已验证原始缓存。按每个完整40年组合发布，未完成组合不入快照，保留上次已有组合；不将缺测值作0。--cache-only只处理已有证据，不联网。运行npm run climate:verify独立用K>308.15计数并核对已保存证据哈希；--require-full严格要求160份原始文件和6条窗口记录，部分预览不能通过完整验收。collection-status.json记录覆盖和未完成窗口。数据许可按AWS官方登记页为CC0（2022-09起），保留NASA归属、数据版本、原始URL和采集时间。

2026-11-18实测：保存81份有效原始CSV；2条完整记录均为上海参考点（历史年均2.5天，ssp126未来21.35天，ssp245未来28天）。独立复算检查80份记录引用（历史基准重复使用），全部一致。SSP585部分年份、鹿特丹基准与未来窗口未完成，NASA目录和点位服务503，暂停后健康检查仍超时。此状态不满足阶段B完整验收，不宣称已覆盖两地点三情景。恢复后复用缓存继续采集，不需要重做有效窗口。

只读API不触发采集；任意输入坐标必须落入已验证格点才返回结果，其他地点或窗口返回unavailable。503用于快照读取或验证失败，400用于参数错误。有效结果缓存300秒；错误no-store。图表展示未来20年的计数和历史年均虚线，支持屏幕阅读摘要；用户随时可查看来源与模型边界。

先接极端高温，后接降水。NASA NEX-GDDP-CMIP6/POWER服务端适配器读取日温度；历史基准和未来窗口必须来自同模型、同网格、同变量。按明确阈值计算超阈值日数；湿度、风和辐射齐全且方法验证后再计算WBGT。禁止年均降雨换算洪水深度。

数据契约：dataset/version/license/sourceUrl/model/member/scenario/variable/unit/latitude/longitude/gridResolution/baselineWindow/horizonWindow/ensembleStatistic/fetchedAt/validAt。数据缺失返回unavailable，不回落成虚构数值；区间记录分位数或模型分布的真实定义。

接口拟为 GET /api/v1/public/climate-risk?lat=&lon=&scenario=&window=&variable=。状态为loading/available/unavailable/error。服务端预计算并缓存，浏览器不加载NetCDF/GeoTIFF。缓存保留最后有效值与过期标记。默认观察窗口2021–2040、2041–2060、2081–2100需验证数据覆盖；不把窗口均值称作某年预测。

验收：至少两地点、两情景的样本与原始数据独立重算一致，单位/基准/日历一致，断网与缺数据不产生数值；再接停工阈值和经行业校准影响函数。洪水/沿海量化另需水文、地形与损失曲线。

## 阶段 C：企业影响、应对与气候背景

滚动五年按事件发生日筛选，保留披露日、报告期、证据来源与修订链。日期精度必须注明；新增披露中的旧灾害不能成为新事件。风险标签分别标注山火、高温、风暴、海平面、政策、市场和技术，支持多因素；不为填满类别强行匹配。

事件类型：impact（风险影响）、adaptation（适应与恢复）、opportunity（商业机遇）。状态：实际/估计/潜在情景/计划/已实施/成效验证。金额保存币种、税前税后、毛额净额、范围、口径和是否鉴证。缺少重要性分母时不用金额作跨企业精确比较；当前impactLevel/relevanceScore属于编辑判断，后续需逐条记录理由。

默认全风险浏览，另可选仅匹配当前风险；再按编辑相关性、影响等级、时间排序，允许独立最新排序。每次6条，显示总数、日期精度和证据定位。当前19条，新增11条，风暴独立标注。保持AI评分和公开门槛流程；手工案例不自动写入资讯时间线。

采集清单：

1. 企业运营公告、IR、年报及SEC申报：每日检查更新；灾害消息跟踪至下一期业绩披露及复产结果。
2. 官网公开CDP答卷和可持续报告：每周检查文档版本/哈希；提取页码或题号及原文短证据。CDP平台需授权，公开PDF也只摘要引用。
3. NOAA CO2月度趋势、Copernicus温度距平：按源频率缓存，显示数据日期及延迟。地区浓度不反推企业排放。

管线：source manifest → fetch/change detection → immutable evidence → extract → deduplicate → review → existing score/publication gate → case index。每次保存checkedAt、contentChangedAt、lastSuccess、error、ETag/Last-Modified、evidenceHash、rightsStatus。HTTP200且只含导航不算有效信源。失败保留历史结果并提示过期。

最低验收：新增和修订去重、实际/潜在分离、恢复计划不标成已实现、CDP年份题号追溯、滚动边界含未来日期排除、原文链接和读取状态可审计。

本次未部署服务端定时采集器。2026-11-18建立对话自动化esg-compass-3，每周三10:00（上海时区）检索增量及存量后续，需本地Codex调度环境；不自动推送部署。数据适配与持续调度完成后，才能宣称服务端持续监控；人工样本不能代表全球完整覆盖。

## 阶段 D：企业气候披露底稿（待开发）

2026-11-18补充：[跨市场披露样本](CLIMATE_DISCLOSURE_BENCHMARKS.md)、[最小实施规格](CLIMATE_DISCLOSURE_WORKPAPER_SPEC.md)及`data/research/climate-disclosure-benchmarks.json`构成设计依据。D1契约与模板→D2三步界面→D3现有条件量化→D4授权企业试用。区分承担主体、期间统计量、比例分母及措施成本是否计入；允许只生成定性草稿。研究样本不作为本企业事实或公共新闻。

价值：形成有企业事实、证据与缺口说明的报告章节材料，不建设完整报告后台或企业档案。市场依据、标准边界和完整契约详见[研究与披露方案](CLIMATE_MARKET_AND_DISCLOSURE_REVIEW.md)。

实施顺序：版本化底稿契约 → 企业边界/期间/标准/事实校验 → 定性文字与条件量化 → 预览、修改和本地导出 → 企业复核记录。当前结果后仅增加一个入口，三步以内完成；首期导出Markdown/CSV/JSON，AI只能组织有证据的文字，句子绑定证据与计算ID，未知保留缺口。输入、情景或模型变化使旧复核失效。

所有金额带币种、期间、税和保险口径；实际、预期、条件敏感性分列。ISSB财务视角与GRI影响视角分别映射，按适用标准版本处理，不自动宣称符合全套标准。企业资料不写公开API或日志；以后若云端存储，先实现身份授权隔离和保留/删除机制。

没有概率及校准影响函数，不升级年均预期损失；现有35°C日数不自动转成停工率或损失。验收包括同版本复算、未知不作零、缺证据不生成事实、豁免需理由、企业边界和时间期限一致、未确认资料不进入公共快照。会计处理、重大性和韧性判断仍需企业依据具体事实复核。

## 发布与回归

A先完成类型检查、计算与边界测试、构建和390px布局验证；B/C单独交付，未验收的数据能力不上线为事实。首页入口不变，PRD和架构同批更新。
