// ESG Compass — 功能跟踪清单
// 用于 /ops 后台展示 + Codex 启动时自动提醒

export interface RoadmapItem {
  id: string;
  label: string;
  category: "已完成" | "进行中" | "待开始" | "已归栈";
  priority: "P0" | "P1" | "P2" | "P3";
  description: string;
  updatedAt: string;
}

export var ROADMAP: RoadmapItem[] = [
  // ── 已完成 ──
  { id: "rm-phases-a-b", label: "Phase A+B: Impact Card + 核心优化", category: "已完成", priority: "P0",
    description: "Policy Impact Card（3种镜片）+ 定位梳理 + 首页时间轴美化 + 精选推荐理由", updatedAt: "2026-07-30" },
  { id: "rm-phase-c", label: "Phase C: 合并知识库到专区", category: "已完成", priority: "P0",
    description: "删除独立KB页面（/kb）+ 删除AI问答（/chat及/api/chat）+ 知识库内容并入专区详情页", updatedAt: "2026-07-31" },
  { id: "rm-curated", label: "精选推荐理由", category: "已完成", priority: "P0",
    description: "LLM-as-Judge + 三维度权重（紧迫性/广度/可转化性），10 条中 4 条精选", updatedAt: "2026-07-28" },
  { id: "rm-ops-dash", label: "运营看板 /ops", category: "已完成", priority: "P1",
    description: "信源状态、管道概览、异常日志、密码登录保护", updatedAt: "2026-07-29" },
  { id: "rm-login", label: "/login 登录页", category: "已完成", priority: "P1",
    description: "中间件保护 /ops 路径，环境变量 ADMIN_PASSWORD 控制", updatedAt: "2026-07-29" },
  { id: "rm-timeline", label: "时间轴美化", category: "已完成", priority: "P1",
    description: "垂直时间轴 + 按日期分组 + 连接线 + 卡片重组", updatedAt: "2026-07-29" },
  { id: "rm-curated-toggle", label: "精选切换按钮", category: "已完成", priority: "P2",
    description: "Tab 栏右侧只看精选开关，独立于分类筛选", updatedAt: "2026-07-29" },
  { id: "rm-cutoff", label: "20 条截断 + 展示更多", category: "已完成", priority: "P2",
    description: "首页默认显示 20 条，底部按钮展开剩余", updatedAt: "2026-07-29" },
  { id: "rm-remove-header", label: "首页去今日重点 header", category: "已完成", priority: "P3",
    description: "去掉标题和描述，页面从 Tab 栏直接开始", updatedAt: "2026-07-29" },
  { id: "rm-zone-crud", label: "ESG 专区建设", category: "已完成", priority: "P1",
    description: "新增 5 个专区（劳工与人权/绿色金融/气候风险/生物多样性/ESG活动），扩展至 8 个专区", updatedAt: "2026-07-30" },
  { id: "rm-workbench", label: "个人工作台 + 私密层", category: "已完成", priority: "P0",
    description: "拆分公开/私密层：middleware 保护 / 登录页 / 工作台页面 / 移除公开 AI 入口", updatedAt: "2026-07-30" },

  { id: "rm-content-clean", label: "存量内容质量清洗", category: "已完成", priority: "P1",
    description: "统一垃圾/相关性规则清洗历史内容：99 → 33 条，回填启发式精选", updatedAt: "2026-07-31" },

  // ── 待开始 ──
  { id: "rm-zone-expand", label: "专区内容增强", category: "进行中", priority: "P1",
    description: "专区后台配置已完成（新增/编辑/删除、自动聚合关键词、关键里程碑管理）；继续丰富专区内容展示", updatedAt: "2026-07-31" },
  { id: "rm-pipeline-optimize", label: "数据管道优化", category: "进行中", priority: "P1",
    description: "质量门禁+启发式精选已上线（垃圾过滤/ESG相关性/三维度+选题价值），存量内容清洗 99→33 条；继续提升信源覆盖与 LLM 结构化质量", updatedAt: "2026-07-31" },
  { id: "rm-kb-to-zone", label: "独立知识库（个人层内部资产）", category: "待开始", priority: "P1",
    description: "不再并入公开专区：工作台内部沉淀政策全文/框架标准/事件知识单元；公开专区保留轻量法规标准导航，通过事件/专区 ID 关联", updatedAt: "2026-08-03" },
  { id: "rm-personal-layer", label: "个人 ESG 工作台（三模块）", category: "待开始", priority: "P0",
    description: "架构已确认：公开层保留 ESG 信息筛选器；个人工作台聚合信息筛选器个人视图/专属 agent/独立知识库；待接入私密知识源、个人记忆与主动任务", updatedAt: "2026-08-03" },
  { id: "rm-graph-engine", label: "图引擎知识库（Graph Engine）", category: "待开始", priority: "P1",
    description: "独立知识库以图结构承载：事件/政策/标准/主体为节点、关联关系为边，支撑专属 agent 的 Graph RAG 检索与推理；先轻量实现，后续按需升级", updatedAt: "2026-08-03" },
  { id: "rm-market-research", label: "市场调研：AI Agent + ESG SaaS", category: "待开始", priority: "P1",
    description: "跟踪 AI Agent 前沿动态；分析双碳/ESG 数字化工具（SaaS）产品形态；产出调研笔记反哺产品迭代", updatedAt: "2026-07-31" },
];
