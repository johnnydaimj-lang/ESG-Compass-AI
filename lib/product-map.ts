// 观澜 / ESG Compass — 产品说明思维导图数据（v9）
// 与 产品说明.md 同步维护；修改后 /ops/product-map 页面自动生效

export interface MapNode {
  label: string;
  detail?: string;
  children?: MapNode[];
}

export const PRODUCT_MAP: MapNode[] = [
  {
    label: "产品定位",
    detail: "有判断力的 ESG 信息筛选器，不只是搬运工",
    children: [
      { label: "核心目标", detail: "3 分钟扫完当下全球 ESG 变化趋势，找到重点领域的原文与解读" },
      { label: "差异化", detail: "不只是信息聚合，而是发现风险及机遇，辅助决策" },
      { label: "目标用户", detail: "公开层：企业 ESG 管理人员 / ESG 咨询顾问；个人层：仅产品所有者" },
      { label: "产品名", detail: "观澜（ESG Compass）" },
      {
        label: "产品架构（升级规划）",
        children: [
          { label: "公开层", detail: "ESG 信息筛选器继续对外开放" },
          {
            label: "个人 ESG 工作台",
            children: [
              { label: "模块 1", detail: "ESG 信息筛选器个人视图" },
              { label: "模块 2", detail: "专属 agent（问答/记忆/主动任务）" },
              { label: "模块 3", detail: "独立知识库（仅内部使用）" }
            ]
          }
        ]
      }
    ]
  },
  {
    label: "页面结构（公开页 + 个人工作台）",
    children: [
      {
        label: "首页 /",
        children: [
          { label: "分类 Tab", detail: "全部 / 政策 / 专家观点 / 学术 / 评级" },
          { label: "精选切换", detail: "只看精选开关，独立于分类筛选" },
          { label: "时间轴", detail: "按日期分组，垂直时间轴" },
          { label: "20 条截断", detail: "默认显示 20 条，底部按钮展开剩余" }
        ]
      },
      {
        label: "事件详情 /events/{id}",
        children: [
          { label: "基本信息", detail: "标题 / 来源 / 时间 / 地区 / 类型" },
          { label: "摘要 + ESG 议题", detail: "参照 SASB 分类体系" },
          { label: "推荐理由", detail: "LLM-as-Judge 三维度：紧迫性 / 广度 / 可转化性" },
          {
            label: "Policy Impact Card",
            children: [
              { label: "政策镜片", detail: "Scope × Magnitude × Enforceability，评分 1-9" },
              { label: "学术镜片", detail: "研究发现 / 方法论质量 / 实践意义" },
              { label: "专家镜片", detail: "核心观点 / 立场分类 / 来源可信度" }
            ]
          },
          { label: "所属专区 + 相关法规标准" }
        ]
      },
      {
        label: "知识专区 /zones",
        children: [
          { label: "8 个专区", detail: "信息披露 / 评级 / 供应链 / 劳工 / 绿色金融 / 气候风险 / 生物多样性 / 活动" },
          { label: "专区卡片", detail: "事件数 / 里程碑数 / 法规标准数" }
        ]
      },
      {
        label: "专区详情 /zones/{id}",
        children: [
          { label: "关键里程碑时间线" },
          { label: "关联事件" },
          { label: "相关法规与标准" }
        ]
      },
      {
        label: "个人 ESG 工作台 /workbench（仅你）",
        children: [
          { label: "模块 1 · 信息筛选器个人视图" },
          { label: "模块 2 · 专属 agent", detail: "AI 问答 / 事件追问 / 个人记忆 / 主动任务" },
          { label: "模块 3 · 独立知识库", detail: "政策全文 / 框架标准 / 事件知识单元 / 私密资料" }
        ]
      }
    ]
  },
  {
    label: "数据模型",
    children: [
      {
        label: "内容类型",
        children: [
          { label: "ESG 政策", detail: "含绿色贸易 / 双碳 / 披露 / 可持续发展" },
          { label: "专家观点", detail: "对政策的点评与解读" },
          { label: "学术文章", detail: "研究与学术分析" },
          { label: "评级动态", detail: "主流 ESG 评级口径变化" }
        ]
      },
      { label: "知识库条目", detail: "法规 / 标准 / 解读 / 实践" },
      { label: "Mock 数据", detail: "16 条事件，四类至少各 1 条，政策与专家观点为主力" }
    ]
  },
  {
    label: "数据管道",
    children: [
      { label: "固定信源池", detail: "RSS / 网页解析，不搜全网" },
      { label: "分层入池", detail: "先抓取 → 去重 → LLM 结构化 → 精选评分" },
      {
        label: "触发方式",
        children: [
          { label: "自动", detail: "每周一、周五 08:00 GitHub Actions" },
          { label: "手动", detail: "npm run pipeline 或后台按钮" }
        ]
      },
      { label: "发布策略", detail: "先发布再人工校对" },
      { label: "LLM", detail: "DeepSeek API（密钥存 GitHub Secrets）" }
    ]
  },
  {
    label: "技术栈",
    children: [
      { label: "框架", detail: "Next.js 16 App Router" },
      { label: "样式", detail: "Tailwind CSS 4 + 自定义 CSS 变量" },
      { label: "部署", detail: "Vercel，git push 自动部署" },
      { label: "图标", detail: "lucide-react" }
    ]
  },
  {
    label: "已完成功能",
    children: [
      {
        label: "Phase A：Policy Impact Card",
        children: [
          { label: "三种镜片", detail: "政策 / 学术 / 专家自动切换" },
          { label: "Mock 数据", detail: "3 条事件含影响分析" }
        ]
      },
      {
        label: "Phase B：核心优化",
        children: [
          { label: "定位梳理", detail: "product-strategy-session + positioning-workshop" },
          { label: "时间轴美化", detail: "按日期分组 + 连接线 + 卡片重组" },
          { label: "精选推荐理由", detail: "LLM-as-Judge 三维度评分" }
        ]
      },
      {
        label: "Phase C：合并知识库到专区",
        children: [
          { label: "删除 /kb", detail: "独立知识库页面移除" },
          { label: "删除 /chat", detail: "AI 问答页面及 API 移除" },
          { label: "KB 并入专区", detail: "内容合并到专区详情页相关法规与标准" }
        ]
      },
      { label: "Bug 修复", detail: "重复 key / a 嵌套 Link / hydration 兼容" }
    ]
  },
  {
    label: "待完善功能",
    children: [
      {
        label: "数据管道优化",
        children: [
          { label: "RSS 信源稳定性", detail: "部分信源解析失败需排查" },
          { label: "LLM 结构化质量", detail: "摘要与议题分类准确性" },
          { label: "精选评分策略", detail: "LLM-as-Judge 提示词优化" }
        ]
      },
      {
        label: "专区内容增强",
        children: [
          { label: "后台配置", detail: "新增 / 编辑 / 删除专区" },
          { label: "内容展示", detail: "丰富专区内容形态" }
        ]
      },
      {
        label: "个人 ESG 工作台",
        children: [
          { label: "架构定义", detail: "信息筛选器个人视图 / 专属 agent / 独立知识库" },
          { label: "专属 agent", detail: "私密知识源接入 / 个人记忆 / 主动任务" },
          { label: "独立知识库", detail: "政策全文 / 框架标准 / 事件知识单元 / 私密资料" },
          { label: "图引擎（Graph Engine）", detail: "事件/政策/标准/主体建图，支撑 Graph RAG 与 agent 推理" }
        ]
      },
      {
        label: "市场调研",
        children: [
          { label: "AI Agent 前沿", detail: "跟踪前沿动态，沉淀对 ESG 产品的启示" },
          { label: "ESG SaaS 竞品", detail: "分析双碳 / ESG 数字化工具的可借鉴点" }
        ]
      }
    ]
  },
  {
    label: "内容飞轮（规划）",
    detail: "对外输出 ESG 深度系列文章",
    children: [
      { label: "观澜周报", detail: "每周选 1 个值得深入的事件，复用 Impact Card 结构" },
      { label: "方法论系列", detail: "如何判断 ESG 信息的紧迫性 / 广度 / 可转化性" },
      { label: "领域深潜", detail: "欧盟供应链合规 / 气候风险量化等专题" },
      { label: "渠道", detail: "微信公众号为主，同步知乎 / 领英" }
    ]
  }
];
