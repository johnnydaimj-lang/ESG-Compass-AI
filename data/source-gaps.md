# ESG Compass 信源缺口报告

生成时间：2026-11-02T16:52:43.584Z

- 总信源：77
- 启用：53
- 正常：40
- 无更新：4
- 异常：1
- 待配置：8
- 停用：24

## 一、待配置信源（8）

### 缺少环境变量（8）
- 普华永道（PwC）ESG 洞察（pwc-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 贝克·麦坚时（Baker McKenzie）ESG/监管洞察（bakermckenzie-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- DLA Piper 洞察（dlapiper-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 富而德（Freshfields）洞察（freshfields-esg，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 邮件订阅信源（IMAP）（email-newsletters，mailbox）：缺少环境变量：MAILBOX_HOST, MAILBOX_USER, MAILBOX_PASSWORD
- 上交所公告与规则（sse-news，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 北交所新闻与公告（bse-news，wechat-search）：缺少环境变量：SOGOU_COOKIE
- 金融监管总局通知公告（nfra-news，wechat-search）：缺少环境变量：SOGOU_COOKIE

## 二、停用信源（24）
- BHR 风险替代检索（GDELT）（bhrrc-gdelt，gdelt）：http://api.gdeltproject.org/api/v2/doc/doc，BHR 主站不可达时的候选检索通道，基于 GDELT 全球新闻聚合；因 GDELT 免费接口有速率限制，当前改由每日全网搜索中的 BHR/劳工专项查询作为实际替代通道。
- CDP 新闻与文章（cdp-articles，browser-render）：https://www.cdp.net/en/insights，CDP Insights 页面只返回导航，文章卡片未进入无障碍 DOM；暂停自动采集，待接入 CDP 内容 API。
- MSCI ESG 评级（候选）（msci-esg-ratings，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=MSCI-China，公司自身评级升降不跟踪；仅在 MSCI 方法、模型或监管变化出现时由评级方法专项检索补充。
- S&P Global ESG 评分（候选）（spglobal-esg-scores，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=%E6%A0%87%E6%99%AE%E5%85%A8%E7%90%83，公司自身 ESG 评分升降不跟踪；S&P Global 气候风险等实质报告由专项搜索和邮件通道覆盖。
- Wind ESG 评级（候选）（wind-esg，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=Wind%20ESG，公司自身 ESG 评级升降不跟踪；仅保留评级方法、模型和监管变化相关检索。
- 恒生可持续发展企业指数（候选）（hsi-esg-index，wechat-search）：https://weixin.sogou.com/weixin?type=2&query=%E6%81%92%E7%94%9F%E6%8C%87%E6%95%B0%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%20%E6%8C%87%E6%95%B0，暂时跳过：恒生指数有限公司服务号未被搜狗收录，待接入官网指数公告或其他渠道后恢复
- 联合国环境规划署（UNEP）新闻与观点（unep-news，browser-render）：https://www.unep.org/news-and-stories，UNEP 官网被 Cloudflare 拦截，普通抓取不可用；已接入浏览器渲染抓取，自动失败时读取人工快照 data/manual/unep-news.html（应用内浏览器打开官方页面后保存）
- 毕马威（KPMG）ESG 洞察（kpmg-esg，webpage）：https://kpmg.com/xx/en/our-insights.html，从 KPMG 洞察列表筛选可持续发展文章，并通过文章页元数据回填日期与摘要。
- 高伟绅（Clifford Chance）洞察（cliffordchance-esg，webpage）：https://www.cliffordchance.com/insights.html，高伟绅洞察文章页未提供可靠发布日期；暂停自动采集，待接入站点 sitemap lastmod。
- X（Twitter）ESG/气候大咖动态（x-esg-experts，x）：https://x.com/，候选信源：需接入 X API 或专用抓取服务后启用
- 深交所规则与公告（szse-rules，webpage）：https://www.szse.cn/lawrules/rule/，深交所规则列表由前端异步接口加载，静态 HTML 不含最新规则；待实现专用接口适配器。
- 美国环保署（EPA）新闻（epa-news，webpage）：https://www.epa.gov/newsreleases，EPA 官方新闻稿，覆盖电厂排放标准、气候变化、污染控制和环境执法。
- 欧洲议会新闻发布室（候选）（eu-parliament-press，browser-render）：https://www.europarl.europa.eu/news/en/press-room，欧洲议会立法谈判和政策表决新闻；官网当前返回 Cloudflare 挑战。
- 欧盟理事会新闻（候选）（eu-council-press，browser-render）：https://www.consilium.europa.eu/en/press/press-releases/，欧盟理事会谈判立场和正式文件；官网当前返回 403。
- 加州空气资源委员会（CARB）新闻（候选）（carb-news，browser-render）：https://ww2.arb.ca.gov/news，CARB 气候披露、交通排放和空气质量规则动态；官网当前返回挑战页。
- S&P Global Sustainable1 洞察（候选）（spglobal-sustainable1，browser-render）：https://www.spglobal.com/sustainable1/en/insights，S&P Global 气候风险和可持续金融研究报告；官网当前返回 403。
- 自然资源部要闻（mnr-news，webpage）：https://www.mnr.gov.cn/dt/ywbb/，自然资源部要闻，覆盖矿产资源、关键矿产、国际合作与矿业可持续发展。
- 市场监管总局新闻（samr-news，webpage）：https://www.samr.gov.cn/xw/zj/，市场监管总局新闻，覆盖反垄断、经营者集中审查、标准与市场治理。
- 美国司法部反垄断司新闻（候选）（doj-antitrust-news，webpage）：https://www.justice.gov/atr/news，覆盖跨国并购、经营者集中和反垄断调查；当前网络无法直连官网。
- 国家电网新闻（state-grid-news，webpage）：http://www.sgcc.com.cn/，国家电网官方新闻与投资数据；建议实现 webpage 适配器后启用。
- 花旗集团新闻（citi-news，webpage）：https://www.citigroup.com/global/news/，花旗官方新闻与可持续金融产品；建议实现 webpage 适配器后启用。
- Google 官方博客（google-blog，rss）：https://blog.google/rss/，Google 清洁能源、数据中心与虚拟电厂动态；RSS 待验证后启用。
- Terradot 新闻（terradot-news，webpage）：https://www.terradot.com/，增强岩石风化碳移除项目动态；建议实现 webpage 适配器后启用。
- 芬兰警方新闻（finnish-police，webpage）：https://poliisi.fi/en/，芬兰警方环境违法调查通报；建议实现 webpage 适配器后启用。
