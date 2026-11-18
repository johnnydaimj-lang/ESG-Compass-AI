# 企业气候情景披露：跨市场样本研究

核对日：2026-11-18。目标是学习企业如何把情景假设变成可解释的经营和财务影响，作为Compass披露底稿的设计依据，不评定企业合规性或为其模型背书。

## 研究范围与证据状态

首批17家，覆盖中国大陆A股、中国香港、中国台湾、法国、德国、荷兰、丹麦、英国、美国、新加坡、澳大利亚、日本、加拿大和瑞士。欧盟为4国目的性样本，尚非全部成员国。样本偏向能公开取得具体方法的较大型企业，不能由此比较各市场整体披露水平。

主要选取2024–2025年度报告及公开CDP答卷；目的是研究披露结构，不将这些版本宣称为所有企业的最新报告。跨境上市企业按报告主体及主要市场组织，不因提交美国20-F就归为美国企业；瑞士单列，不归入欧盟。

14家核对了相关章节或选定PDF页；台积电、Schneider Electric、Maersk目前只完成官方索引摘录核对，因PDF大小或读取限制，未完成整页表格复核。三项保留为有条件参考，不作为可以直接移植的量化模型。原始报告下载和渲染保留在本地忽略目录`.codex-artifacts/climate-research`，不再分发整份报告。

机器可读样本索引：[climate-disclosure-benchmarks.json](../data/research/climate-disclosure-benchmarks.json)。每条包括市场、文件年度、来源、定位、核对方式、情景、期限、展示方式、发现、可借鉴点及不可迁移的限制。核对日不表示原文发布日、灾害日或数据基准年；它们也不是新增企业受灾事件，不写进事件时间线。

## 逐市场样本

| 市场 / 企业 | 报告及定位 | 情景与影响如何呈现 | 对Compass的启示 |
| --- | --- | --- | --- |
| A股 / 宁德时代 | [2024 ESG报告](https://www.catl.com/uploads/1/file/public/202503/20250328110514_yhfqo19im4.pdf)，pp.71–78 | RCP物理、NGFS转型风险、IEA机遇分开；资产/营收敞口分档，机遇营收与毛利用颜色矩阵 | 公开半定量结果也应标清口径；颜色不能反推金额 |
| A股 / 宝钢股份 | [2024可持续发展报告](https://static.cninfo.com.cn/finalpage/2025-04-26/1223329096.PDF)，pp.50–57 | RCP4.5/6.0与CISA、IEA行业路径；业务、财务、期限、等级和措施并列，部分金额可量化 | 允许部分定量和明确未量化；先确认成本承担主体 |
| 中国香港 / 太古股份 | [2024气候财务披露](https://sr.swirepacific.com/en/sr2024/our-business/climate-related-financial-disclosures)，Strategy及脚注 | 2030/2050、低高碳路径、企业自定义财务影响等级；固有风险与措施说明 | 公司阈值可配置，不能通用套用；措施前后明确分列 |
| 中国台湾 / 台积电† | [2024 Climate and Nature Report](https://esg.tsmc.com/en-US/file/public/2024-TSMC-Climate-and-Nature-Report-e.pdf)，p.15 | NZE/STEPS下2030/2040碳价影响占营收比，有无持续减碳管理两路径 | 同时呈现比例、管理措施和未计入成本 |
| 法国 / Schneider Electric† | [2024注册文件](https://www.se.com/ww/en/assets/564/document/510443/2024-universal-registration-document.pdf)，Climate scenario analysis，页码待核 | RCP/SSP/NGFS叙事结合厂址审计、脆弱性画像与措施 | 全球数据先筛查，厂址事实再核实 |
| 法国 / Danone | [2024注册文件](https://www.danone.com/content/dam/corp/global/danonecom/investors/en-all-publications/2025/registrationdocuments/urd2024accessibleversion.pdf)，pp.201–203 | 对重要转型驱动建立财务传导，选用WBCSD农业/林业/土地利用情景 | 行业适配比机构名称更关键，不能假定三大机构覆盖全部需求 |
| 德国 / BASF | [2025 E1气候章节](https://report.basf.com/2025/en/combined-managements-report/consolidated-sustainability-statement/environment/e1-climate-change.html)，Physical risks | SSP5-8.5优先筛查，必要时加温和路径；重要风险再量化 | 先经营依赖与脆弱性，再投入量化，不用任意综合分 |
| 荷兰 / ASML | [2024 TCFD报告](https://ourbrand.asml.com/m/51517ae95567bca2/original/2024-TCFD-Report-Climate-related-disclosure.pdf)，pp.3–7 | 1.5°C转型、4°C物理；定性等级、价值链位置、营收/CapEx/OpEx方向及措施 | 无金额时仍可形成清楚、可追溯的财务影响表 |
| 丹麦 / Maersk† | [2024年报](https://investor.maersk.com/static-files/31bf05a1-6f0c-4fbd-a3c7-3f58e044f668)，p.88 | 地图和五个资产卡片，2050年损坏及营收影响估计，说明不含网络连锁影响 | GIS是解释结果的辅助；每张资产卡要写损失边界 |
| 英国 / Unilever | [2025年报](https://www.unilever.com/files/unilever-annual-report-and-accounts-2025.pdf)，pp.224–225 | 多SSP路径、2030/2039/2050、营收比例、Gross/Net及逐项假设 | 对比表要绑定分母、业务边界和措施假设，保留年度方法变更 |
| 美国 / Delta Air Lines | [2024附加气候披露](https://esghub.delta.com/content/esg/en/2024/climate-related-disclosures.html)，Forecast及风险表 | 物理RCP与转型IEA路径分别分析，说明为什么仅展示部分较高影响结果 | 展示子集须说明筛选理由；不让一张“低中高”表掩盖方法差异 |
| 美国 / Pfizer | [2025 CDP答卷](https://cdn.pfizer.com/pfizercom/2025_CDP_Response_Pfizer_Inc.pdf)，5.1.1及3.1.1 | RCP及NGFS，题号化记录覆盖、基准、期限、选择理由、假设、未来金额和行动 | 参考问卷结构建立底稿；历史事实与未来金额分离 |
| 新加坡 / Keppel | [2025可持续报告](https://www.keppel.com/file/sustainability/sustainability-reports/keppel-sustainability-report-2025.pdf)，pp.25–27 | 展示从定性到定量的演进；19项资产的2030年均损坏影响约1400万–1600万新元 | 报告年度与分析基年分开；持有期限决定哪些远期结果相关 |
| 澳大利亚 / BHP | [CTAP 2024](https://www.bhp.com/es/-/media/documents/investors/annual-reports/2024/240827_bhpclimatetransitionactionplan2024.pdf)，pp.32–35 | 企业1.5°C路径对规划基准作商品价/碳价NPV敏感性，其他假设保持基准 | 把压力测试、预算与会计估值分开，说明哪些变量发生变化 |
| 日本 / Toyota | [Sustainability Data Book 2025](https://global.toyota/pages/global_toyota/sustainability/report/sdb/sdb25_en.pdf)，pp.48–51 | 1.5°C/4°C，High/Medium/Slight定性财务表，并定义等级 | 定性结果要解释等级含义；同名文件持续修订，必须锁定读取版本 |
| 加拿大 / RBC | [2024可持续报告](https://www.rbc.com/investor-relations/_assets-custom/pdf/RBC-2024-sustainability-report.pdf)，p.65，Table17 | 转型/洪水情景对应不同贷款组合、地区及PD/LGD/预期损失指标 | 金融机构应另设模板，不把制造业停工计算器套进信用风险 |
| 瑞士 / Nestlé | [2024非财务声明](https://www.nestle.com/sites/default/files/2025-02/non-financial-statement-2024.pdf)，pp.22–24 | 高、中、巴黎目标路径，方向性的累计十年DCF影响，列政策/技术/市场代理变量 | 标明累计或年度、折现与代理变量，不将DCF称作年损失 |

† 仅官方索引摘录核对，待整页复核。未核读的图形数值一律不推断。

## 必须辨析的四组概念

### 1. 暴露不是损失，模型量化也不等于公开量化

宁德时代把不同风险等级下的资产与营收分布作为敞口指标；机遇比较以色块展示规模。这说明企业可能内部运行量化模型，而公开报告只提供分档。Compass应支持定性、分档和数值三种表达，不能把色块称为有金额的损失测算。

### 2. 措施后影响不一定已经扣除措施成本

台积电样本比较持续减碳管理前后的碳定价影响，但脚注明确未计减碳成本。产品必须分别保存风险成本减少、实施成本及总净财务影响；后两者缺失时，只能说“碳价影响降低”，不能说“项目净收益提高”。

### 3. 有金额仍可能是其他主体、其他期间或其他统计量

宝钢报告CBAM示例的承担者是欧盟进口商，不能全部当作宝钢自己的利润减少。Keppel是未来年均物理损坏估计，且引用2022–2023分析，不是2025实际灾害损失。Nestlé的累计十年折现口径与单年成本不同。应强制保存承担主体、期间、统计量及币种。

### 4. 可借鉴披露结构，不盲从企业模型

BASF的重要性阈值、太古的影响分档都是企业自己的管理口径。BHP的自建情景是敏感性工具，不能替代Compass官方版本目录。Maersk索引中温升标签需向IPCC原始资料另核；企业报告出现一种写法，不表示它就是科学定义。旧版IEA APS也不能直接加入当前WEO2025目录。

## 从研究落到产品的决定

以下为Compass设计判断，不是样本企业或标准的原文要求。

1. **先做定性底稿，再允许有依据的部分量化。** 无金额时生成“风险→经营后果→财务项目→期限→措施→不确定性”，不自动填损失比例。ASML及Toyota支持这种信息组织方式。
2. **结果以表格为中心。** 一行一个风险/机遇，同一口径下对比2–3条路径；可展开来源和假设。地图、长情景介绍及高级输入后置。
3. **用指标分类代替综合得分。** 先区分危险度、敞口、条件敏感性、概率损失和估值敏感性；初版只支持前三类有依据的部分。
4. **先选业务模式。** 首期服务非金融企业，优先制造/运营依赖场景；金融模板暂缓，不以PD/LGD/ECL装饰成熟度。
5. **措施状态显式选择。** 已实施、已批准计划、尚未批准设想分开；没有数据时不生成“剩余风险低”或“整体具备韧性”的结论。
6. **将证据与缺口同时导出。** 文件年度、数据基准、版本、假设和读取状态都可追溯；未整页核对的样本仅供研究，不用于自动生成用户企业事实。

具体字段、交互及验收见[披露底稿实施规格](CLIMATE_DISCLOSURE_WORKPAPER_SPEC.md)。本批完成研究与方案，不向线上实验室添加尚未经验证的披露按钮。

## 已知缺口与下一批研究

另外检索到两个欧盟国家的原始报告，当前只读到官方索引摘录，作为补充线索而未计入上述17家：

- 意大利：[Enel 2024 Integrated Annual Report](https://www.enel.com/content/dam/enel-com/documenti/investitori/informazioni-finanziarie/2024/annuali/en/integrated-annual-report_2024.pdf)。披露企业能源系统模型与物理情景的一致性框架；32MB文件未完成整章核对，不继承未核实的路径参数。
- 西班牙：[Iberdrola 2024 Sustainability Reporting，v3](https://www.iberdrola.com/documents/20125/4778712/gsm25-sustainability-report-2024.pdf/3679ee55-119a-48d6-8383-c68aa37ee6d8?download=true&t=1750414089588&version=3.0)。索引显示物理风险使用SSP1-2.6/2-4.5/5-8.5，并区分已实施适应措施与2050剩余风险；15MB文件尚待整页复核，不把摘录的企业韧性判断当作独立验证结果。

- 三份索引样本需复核整页及脚注，尤其Maersk温升标注和Schneider具体量化口径。
- 中国香港当前详细样本集中于太古，其他香港发行人的金融与地产模板需补充；台湾除台积电外需扩展非半导体样本。
- 欧盟尚未覆盖全部成员国；意大利、西班牙线索需升级为章节核对，北欧其他国家及新西兰、韩国等也可补充，不能宣称本轮已完成这些市场研究。
- 后续可对同一企业连续年度追踪方法变更，而非只堆积报告数量。相同报告在官网、交易所和SEC出现时，应按主体/年度/文档版本去重。
- 本研究不是地区法规适用性清单；地域、主体、报告期和规则过渡安排需在实际披露时另行核实。
