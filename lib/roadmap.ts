// ESG Compass — 功能跟踪清单
// 用于 /ops 后台展示 + Codex 启动时自动提醒
// 更新方式：在已有数组中追加新条目即可

export interface RoadmapItem {
  id: string;
  label: string;
  category: "已完成" | "进行中" | "待开始" | "已归档";
  priority: "P0" | "P1" | "P2" | "P3";
  description: string;
  updatedAt: string;
}

export var ROADMAP: RoadmapItem[] = [
  // ── 已完成 ──────────────────────────────────
  // ── 进行中 ──────────────────────────────────
  { id: "rm-chat-kb", label: "AI 助手 + 知识库（Step 1）", category: "进行中", priority: "P0",
    description: "/chat 页面 + /api/chat 接口 + 事件详情页入口 + 知识库 11 条数据（CSDDD/CBAM/ISSB/SASB/GRI/TCFD 等）", updatedAt: "2026-07-29" },

  // ── 待开始 ──────────────────────────────────
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

  // ── 进行中 ──────────────────────────────────

  // ── 待开始 ──────────────────────────────────
  { id: "rm-zone-crud", label: "ESG 专区建设", category: "待开始", priority: "P1",
    description: "新增/编辑/删除专区，手动选择事件或自动聚合；专区图片上传", updatedAt: "2026-07-28" },
  { id: "rm-ai-search", label: "增强检索（AI 检索）", category: "待开始", priority: "P1",
    description: "基于知识库的语义检索，支持自然语言提问，结果附带来源引用", updatedAt: "2026-07-28" },
  { id: "rm-knowledge-base", label: "知识库建设", category: "待开始", priority: "P1",
    description: "政策全文库 / 框架标准库（SASB/GRI/ISSB/TCFD）/ 事件知识单元沉淀 / 向量化索引", updatedAt: "2026-07-28" },
];
