# ESG Compass 信源缺口报告

生成时间：2026-11-01T15:25:10.466Z

- 总信源：77
- 启用：51
- 正常：18
- 无更新：14
- 异常：1
- 待配置：18
- 停用：26

## 一、待配置信源（18）

### 适配器未实现（10）
- 欧盟委员会（eu-commission，eu-presscorner）：实时模式尚未实现 eu-presscorner 适配器，本次沿用快照材料
- IFRS / ISSB 新闻（ifrs-issb，sitemap）：实时模式尚未实现 sitemap 适配器，本次沿用快照材料
- 学术文章（Crossref ESG 检索）（ssrn-esg，api）：实时模式尚未实现 api 适配器，本次沿用快照材料
- CDP 新闻与文章（cdp-articles，markdown）：实时模式尚未实现 markdown 适配器，本次沿用快照材料
- 联合国环境规划署（UNEP）新闻与观点（unep-news，browser-render）：实时模式尚未实现 browser-render 适配器，本次沿用快照材料
- 联合国气候变化框架公约（UNFCCC）新闻（unfccc-news，browser-render）：实时模式尚未实现 browser-render 适配器，本次沿用快照材料
- 世界银行新闻与报告（worldbank-news，worldbank）：实时模式尚未实现 worldbank 适配器，本次沿用快照材料
- ISO 标准动态（iso-news，browser-render）：实时模式尚未实现 browser-render 适配器，本次沿用快照材料
- SBTi 科学碳目标动态（sbti-news，sitemap）：实时模式尚未实现 sitemap 适配器，本次沿用快照材料
- 中国商务部政策发布（mofcom-china，mofcom）：实时模式尚未实现 mofcom 适配器，本次沿用快照材料

### 缺少环境变量（8）
- 普华永道（PwC）ESG 洞察（pwc-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 贝克·麦坚时（Baker McKenzie）ESG/监管洞察（bakermckenzie-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- DLA Piper 洞察（dlapiper-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 富而德（Freshfields）洞察（freshfields-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 邮件订阅信源（IMAP）（email-newsletters，mailbox）：缺少环境变量：MAILBOX_HOST, MAILBOX_USER, MAILBOX_PASSWORD
- 上交所公告与规则（sse-news，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 北交所新闻与公告（bse-news，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 金融监管总局通知公告（nfra-news，wechat-search）：缺少环境变量：SOGOU_COOKIE

## 二、停用信源（26）
- BHR 风险替代检索（GDELT）（bhrrc-gdelt，gdelt）：http://api.gdeltproject.org/api/v2/doc/doc，BHR 主站不可达时的候选检索通道，基于 GDELT 全球新闻聚合；因 GDELT 免费接口有速率限制，当前改由每日全网搜索中的 BHR/劳工专项查询作为实际替代通道。
- MSCI ESG 评级（候选）（msci-esg-ratings，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=MSCI-China，公司自身评级升降不跟踪；仅在 MSCI 方法、模型或监管变化出现时由评级方法专项检索补充。
- S&P Global ESG 评分（候选）（spglobal-esg-scores，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=%E6%A0%87%E6%99%AE%E5%85%A8%E7%90%83，公司自身 ESG 评分升降不跟踪；S&P Global 气候风险等实质报告由专项搜索和邮件通道覆盖。
- Wind ESG 评级（候选）（wind-esg，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=Wind%20ESG，公司自身 ESG 评级升降不跟踪；仅保留评级方法、模型和监管变化相关检索。
- 恒生可持续发展企业指数（候选）（hsi-esg-index，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=%E6%81%92%E7%94%9F%E6%8C%87%E6%95%B0%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%20%E6%8C%87%E6%95%B0，暂时跳过：恒生指数有限公司服务号未被搜狗收录，待接入官网指数公告或其他渠道后恢复
- X（Twitter）ESG/气候大咖动态（x-esg-experts，x）：https://x.com/，候选信源：需接入 X API 或专用抓取服务后启用
- 美国环保署（EPA）新闻（epa-news，webpage）：https://www.epa.gov/newsreleases，EPA 官方新闻稿，覆盖电厂排放标准、气候变化、污染控制和环境执法。
- 欧洲议会新闻发布室（候选）（eu-parliament-press，browser-render）：https://www.europarl.europa.eu/news/en/press-room，欧洲议会立法谈判和政策表决新闻；官网当前返回 Cloudflare 挑战。
- 欧盟理事会新闻（候选）（eu-council-press，browser-render）：https://www.consilium.europa.eu/en/press/press-releases/，欧盟理事会谈判立场和正式文件；官网当前返回 403。
- 加州空气资源委员会（CARB）新闻（候选）（carb-news，browser-render）：https://ww2.arb.ca.gov/news，CARB 气候披露、交通排放和空气质量规则动态；官网当前返回挑战页。
- S&P Global Sustainable1 洞察（候选）（spglobal-sustainable1，browser-render）：https://www.spglobal.com/sustainable1/en/insights，S&P Global 气候风险和可持续金融研究报告；官网当前返回 403。
- 自然资源部要闻（mnr-news，webpage）：https://www.mnr.gov.cn/dt/ywbb/，自然资源部要闻，覆盖矿产资源、关键矿产、国际合作与矿业可持续发展。
- 市场监管总局新闻（samr-news，webpage）：https://www.samr.gov.cn/xw/zj/，市场监管总局新闻，覆盖反垄断、经营者集中审查、标准与市场治理。
- 美国司法部反垄断司新闻（候选）（doj-antitrust-news，webpage）：https://www.justice.gov/atr/news，覆盖跨国并购、经营者集中和反垄断调查；当前网络无法直连官网。
- 联合国新闻（un-news，webpage）：https://news.un.org/en/，联合国官方新闻；建议实现 webpage/rss 适配器后启用。
- 世界气象组织（WMO）新闻（wmo-news，webpage）：https://wmo.int/news/，WMO 官方新闻与温室气体公报；建议实现 webpage 适配器后启用。
- 绿色气候基金（GCF）新闻（gcf-news，webpage）：https://www.greenclimate.fund/news，GCF 官方新闻与董事会项目；建议实现 webpage 适配器后启用。
- 亚洲基础设施投资银行（AIIB）新闻（aiib-news，webpage）：https://www.aiib.org/en/news-events/news/，AIIB 官方新闻与项目；建议实现 webpage 适配器后启用。
- 联合国生物多样性公约（CBD）新闻（cbd-news，webpage）：https://www.cbd.int/，CBD/COP 官方新闻与会议成果；建议实现 webpage 适配器后启用。
- Carbon Brief（carbon-brief，rss）：https://www.carbonbrief.org/feed/，气候政策与能源分析；RSS 待验证后启用。
- 国家电网新闻（state-grid-news，webpage）：http://www.sgcc.com.cn/，国家电网官方新闻与投资数据；建议实现 webpage 适配器后启用。
- Finance for Biodiversity Foundation（finance-biodiversity，webpage）：https://www.financeforbiodiversity.org/，自然相关金融披露与金融机构倡议；建议实现 webpage 适配器后启用。
- 花旗集团新闻（citi-news，webpage）：https://www.citigroup.com/global/news/，花旗官方新闻与可持续金融产品；建议实现 webpage 适配器后启用。
- Google 官方博客（google-blog，rss）：https://blog.google/rss/，Google 清洁能源、数据中心与虚拟电厂动态；RSS 待验证后启用。
- Terradot 新闻（terradot-news，webpage）：https://www.terradot.com/，增强岩石风化碳移除项目动态；建议实现 webpage 适配器后启用。
- 芬兰警方新闻（finnish-police，webpage）：https://poliisi.fi/en/，芬兰警方环境违法调查通报；建议实现 webpage 适配器后启用。
