# 气候风险实验室实施方案

决策日期：2026-11-18。状态：阶段 A 已实现，B/C 尚待数据接入与验收。本文件替代原型中情景乘数、统一脆弱度和价值指数的设计。

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

先接极端高温，后接降水。NASA NEX-GDDP-CMIP6/POWER服务端适配器读取日温度；历史基准和未来窗口必须来自同模型、同网格、同变量。按明确阈值计算超阈值日数；湿度、风和辐射齐全且方法验证后再计算WBGT。禁止年均降雨换算洪水深度。

数据契约：dataset/version/license/sourceUrl/model/member/scenario/variable/unit/latitude/longitude/gridResolution/baselineWindow/horizonWindow/ensembleStatistic/fetchedAt/validAt。数据缺失返回unavailable，不回落成虚构数值；区间记录分位数或模型分布的真实定义。

接口拟为 GET /api/v1/public/climate-risk?lat=&lon=&scenario=&window=&variable=。状态为loading/available/unavailable/error。服务端预计算并缓存，浏览器不加载NetCDF/GeoTIFF。缓存保留最后有效值与过期标记。默认观察窗口2021–2040、2041–2060、2081–2100需验证数据覆盖；不把窗口均值称作某年预测。

验收：至少两地点、两情景的样本与原始数据独立重算一致，单位/基准/日历一致，断网与缺数据不产生数值；再接停工阈值和经行业校准影响函数。洪水/沿海量化另需水文、地形与损失曲线。

## 阶段 C：企业影响、应对与气候背景

滚动五年按事件发生日筛选，保留披露日、报告期、证据来源与修订链。日期精度必须注明；新增披露中的旧灾害不能成为新事件。风险标签分别标注山火、高温、风暴、海平面、政策、市场和技术，支持多因素；不为填满类别强行匹配。

事件类型：impact（风险影响）、adaptation（适应与恢复）、opportunity（商业机遇）。状态：实际/估计/潜在情景/计划/已实施/成效验证。金额保存币种、税前税后、毛额净额、范围、口径和是否鉴证。缺少重要性分母时不用金额作跨企业精确比较；当前impactLevel/relevanceScore属于编辑判断，后续需逐条记录理由。

排序先匹配风险，再按编辑相关性、影响等级、时间；允许独立最新排序。保持AI评分和公开门槛流程；原型手工案例不自动写入资讯时间线。

采集清单：

1. 企业运营公告、IR、年报及SEC申报：每日检查更新；灾害消息跟踪至下一期业绩披露及复产结果。
2. 官网公开CDP答卷和可持续报告：每周检查文档版本/哈希；提取页码或题号及原文短证据。CDP平台需授权，公开PDF也只摘要引用。
3. NOAA CO2月度趋势、Copernicus温度距平：按源频率缓存，显示数据日期及延迟。地区浓度不反推企业排放。

管线：source manifest → fetch/change detection → immutable evidence → extract → deduplicate → review → existing score/publication gate → case index。每次保存checkedAt、contentChangedAt、lastSuccess、error、ETag/Last-Modified、evidenceHash、rightsStatus。HTTP200且只含导航不算有效信源。失败保留历史结果并提示过期。

最低验收：新增和修订去重、实际/潜在分离、恢复计划不标成已实现、CDP年份题号追溯、滚动边界含未来日期排除、原文链接和读取状态可审计。

本次未部署定时采集器或新增自动化。数据适配与持续调度完成后，才能宣称持续监控；首批手工样本不能代表全球完整覆盖。

## 发布与回归

A先完成类型检查、计算与边界测试、构建和390px布局验证；B/C单独交付，未验收的数据能力不上线为事实。首页入口不变，PRD和架构同批更新。
