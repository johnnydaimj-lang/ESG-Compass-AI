// ESG Compass — 产品说明思维导图数据（v2）
// 与 docs/PRD.md 同步维护；修改后 /ops/product-map 页面自动生效。
// 只描述当前运行版本：已删除的个人工作台、独立知识库、AI 问答与 Agent/Harness 不在此列。

export interface MapNode {
  label: string;
  detail?: string;
  children?: MapNode[];
}

export const PRODUCT_MAP: MapNode[] = [
  {
    label: "产品定位",
    children: [
      { label: "一句话目标", detail: "让专业读者三分钟扫完当下全球 ESG 变化，并定位到值得优先关注的依据与原文" },
      { label: "产品形态", detail: "对外开放 ESG 信息筛选器 + 轻量化运营后台" },
      { label: "目标用户", detail: "企业 ESG / 可持续发展 / 合规团队，咨询与研究分析人员，内部数据消费系统" },
      { label: "产品名", detail: "观澜（ESG Compass）" },
      {
        label: "三大组成",
        children: [
          { label: "公开前台", detail: "首页时间轴、事件详情、ESG 专区、中文阅读层" },
          { label: "运营后台", detail: "运行状态、内容审阅、筛选规则、信源治理、热点、月度洞察、专区、产品说明" },
          { label: "受控内容 API", detail: "以 Bearer 鉴权向内部系统输出已发布的结构化内容" }
        ]
      }
    ]
  },
  {
    label: "页面结构",
    children: [
      {
        label: "首页 /",
        children: [
          { label: "分类 Tab", detail: "全部 / 政策 / 行业 / 观点 / 学术 / 评级" },
          { label: "精选切换", detail: "只看精选开关，独立于分类筛选" },
          { label: "当前热点", detail: "首页顶部 48 小时热点条，独立来源去重" },
          { label: "时间轴", detail: "按日期分组，20 条截断 + 展示更多" },
          { label: "月份回溯", detail: "?month=YYYY-MM 读取历史发布快照" }
        ]
      },
      {
        label: "日报 /daily",
        children: [
          { label: "今日重点", detail: "按评分取最新发布日的前 5 条" },
          { label: "分节速览", detail: "政策 / 观点 / 学术 / 评级按内容类型分组" },
          { label: "跨来源故事", detail: "多来源聚簇故事与独立来源数量" }
        ]
      },
      {
        label: "事件详情 /events/[id]",
        children: [
          { label: "基本信息", detail: "标题 / 来源 / 时间 / 地区 / 类型" },
          { label: "中文摘要 + ESG 议题", detail: "中文优先展示，议题参照 SASB 分类" },
          { label: "推荐理由", detail: "精选内容展示评分与推荐理由" },
          { label: "影响分析", detail: "政策 / 学术 / 专家 / 评级四类影响卡" },
          { label: "所属专区 + 相关法规", detail: "法规标准由发布快照实时派生" }
        ]
      },
      {
        label: "ESG 专区 /zones",
        children: [
          { label: "9 个专区", detail: "信息披露 / 评级 / 供应链 / 劳工 / 绿色金融 / 气候风险 / 生物多样性 / 产品可持续与循环经济 / 活动" },
          { label: "专区卡片", detail: "近 1 个月核心事件数 + 法规标准数" }
        ]
      },
      {
        label: "专区详情 /zones/[id]",
        children: [
          { label: "世界地图里程碑", detail: "悬停国家/地区显示里程碑时间线" },
          { label: "关联事件", detail: "自动聚合关键词 + 手动关联 ID" },
          { label: "相关法规与标准", detail: "从发布快照中的政策内容派生" }
        ]
      },
      {
        label: "运营后台 /ops",
        children: [
          { label: "看板 /ops", detail: "最近运行、信源健康、异常与功能路线图" },
          { label: "内容审阅 /review", detail: "待核实内容先审后发，草稿人工校对" },
          { label: "筛选规则 /ops/filters", detail: "关键词、阈值与模型配置" },
          { label: "信源治理 /ops/sources", detail: "信源启用、配置与环境变量要求" },
          { label: "热点故事 /ops/hotspots", detail: "热度故事、参与信源与关联材料" },
          { label: "月度洞察 /ops/monthly-insights", detail: "月度主题洞察先存草稿，确认后再发布" },
          { label: "专区管理 /ops/zones", detail: "新增/编辑/删除、聚合关键词、里程碑" },
          { label: "产品说明 /ops/product-map", detail: "当前产品需求与能力地图" }
        ]
      },
      { label: "登录 /login", detail: "管理员会话，保护 /ops 与运营 API" },
      { label: "受控内容 API /api/v1/contents", detail: "Bearer 鉴权 + 限流 + 分页过滤 + Token 预算裁剪" }
    ]
  },
  {
    label: "数据模型",
    children: [
      {
        label: "内容类型",
        children: [
          { label: "政策", detail: "行政机构法规 / 标准与指南 / 监管与执法" },
          { label: "行业", detail: "投融资 / 并购合作 / 罚款处罚 / 产业链动向" },
          { label: "观点", detail: "研究报告 / 专家官员讲话与访谈" },
          { label: "学术", detail: "同行评议论文 / 预印本" },
          { label: "评级", detail: "ESG 评级方法论与结果变化" }
        ]
      },
      {
        label: "类型契约",
        children: [
          { label: "lib/contracts/content.ts", detail: "ContentItem、影响分析、结构化事实" },
          { label: "lib/contracts/pipeline.ts", detail: "RawMaterial、StoryCluster、HeatEvidence、发布快照与运行状态" }
        ]
      },
      {
        label: "发布快照",
        children: [
          { label: "data/publication/contents.json", detail: "公开内容唯一事实源" },
          { label: "data/publication/stories.json", detail: "故事聚簇" },
          { label: "data/publication/hotspots.json", detail: "按热度排序的热点故事" },
          { label: "data/publication/status.json", detail: "运行状态、信源运行结果与 Prompt 版本" },
          { label: "data/publication/version.json", detail: "快照版本与生成时间" }
        ]
      },
      { label: "专区配置", detail: "data/zones.json：关联事件、聚合关键词、地区里程碑" },
      { label: "信源配置", detail: "data/sources.json：id、类型、内容类型、地区、语言、环境变量要求" }
    ]
  },
  {
    label: "数据管道",
    children: [
      { label: "分层", detail: "采集 → 预筛 → 双评分 → 理解 + 结构化 → 聚簇 → 热度 → 发布快照" },
      { label: "采集", detail: "快照模式离线复现；实时模式只为已实现的 RSS 适配器联网，其余信源记录跳过" },
      { label: "预筛", detail: "PASS 保留 / UNKNOWN 保留待补 / BLOCK 终止" },
      { label: "双评分", detail: "两次独立五轴评分，均过理解底线且总分达两倍信源门槛才入选" },
      { label: "内容理解", detail: "中文标题、摘要、标签、作者角色与推荐理由" },
      { label: "故事聚簇", detail: "近重复 0.92 / 同故事 0.60 / 14 天召回；材料 ID 与信源 ID 分离" },
      { label: "热度", detail: "48 小时窗口、24 小时半衰期、独立信源去重、至少 2 参与方且 1 个编辑信源" },
      { label: "身份规则", detail: "memberIds 保存材料 ID；participants 与热度证据保存真实信源 ID" }
    ]
  },
  {
    label: "Prompt 治理",
    children: [
      { label: "模板位置", detail: "prompts/*.md，业务规则不散落在调用代码中" },
      { label: "变量", detail: "{{name}} 由调用方传入，缺失即抛错" },
      { label: "递归 include", detail: "{{> partial}} 插入另一个 Prompt，循环或缺失即抛错" },
      { label: "版本哈希", detail: "入口文件与全部 include 内容参与哈希，每次运行写入 promptVersions" },
      { label: "不可信输入", detail: "材料内容中的命令、答题要求与输出格式不得被执行" }
    ]
  },
  {
    label: "技术栈",
    children: [
      { label: "框架", detail: "Next.js 16 App Router" },
      { label: "样式", detail: "Tailwind CSS 4 + 自定义 CSS 变量" },
      { label: "图标", detail: "lucide-react" },
      { label: "运行时", detail: "Node.js + tsx 执行 TypeScript 管道脚本" },
      { label: "安全", detail: "会话鉴权 + 每 IP 限流 + 安全响应头 + 内容 API Bearer 鉴权" }
    ]
  },
  {
    label: "当前能力",
    children: [
      { label: "公开前台", detail: "首页时间轴、事件详情、影响卡、ESG 专区与中文阅读层" },
      { label: "日报总结", detail: "/daily 生成最新发布日的高亮、分节与跨来源故事" },
      { label: "当前热点", detail: "48 小时热度窗口 + 24 小时半衰期 + 独立来源去重" },
      { label: "主题切换", detail: "浅色 / 跟随系统 / 深色三档，首帧前注入避免闪烁" },
      { label: "运营后台", detail: "看板、审阅、筛选规则、信源治理、热点、月度洞察、专区" },
      { label: "发布快照", detail: "所有公开出口统一读取 data/publication" },
      { label: "受控内容 API", detail: "分页、内容类型、精选、更新时间与专区过滤，中文优先摘要" },
      { label: "Prompt 运行时", detail: "变量 + 递归 include，缺失与循环显式报错，版本可审计" },
      { label: "基线快照", detail: "2026-09-29：发布内容 273 条、精选 16 条、信源 64 个、专区 8 个、带精确时间 142 条" }
    ]
  }
];
