# ESG Compass API 接入说明

ESG Compass 提供两组只读 API：

- `/api/v1/public/*`：个人工作平台可直接调用，无需共享密钥。
- `/api/v1/*`：Bearer Token 鉴权版本，适合需要独立访问控制的场景。

所有接口支持跨域 `GET` 与 `OPTIONS`，公开接口默认缓存 5 分钟。

## 公共 API

线上基础地址：

```text
https://esg-compass-ai.vercel.app/api/v1/public
```

### 接口目录

```http
GET /api/v1/public
GET /api/v1/public/contents
GET /api/v1/public/contents/{id}
GET /api/v1/public/daily
GET /api/v1/public/zones
GET /api/v1/public/status
GET /api/v1/public/climate-risk?lat=31.23&lon=121.47&scenario=ssp245&window=2041–2060&variable=tasmax
```

### 内容列表

```http
GET /api/v1/public/contents?curated=true&pageSize=20
```

支持的查询参数：

| 参数 | 说明 |
| --- | --- |
| `q` | 中文或英文关键词 |
| `contentType` / `type` | `政策`、`行业`、`观点`、`学术`、`评级`，也支持 `policy` 等英文 slug |
| `curated` / `recommended` | `true` 仅返回精选，`false` 仅返回非精选 |
| `since` / `updatedAfter` | 按发布时间过滤，传入 ISO 日期时间 |
| `zone` | 知识专区 ID |
| `page` | 页码，从 1 开始 |
| `pageSize` / `limit` | 每页数量，最大 50 |

返回内容包含：

- `displayTitle`：优先中文标题。
- `displaySummary`：优先中文摘要。
- `reason`：仅精选内容返回推荐理由。
- `score`：综合评分。
- `sourceName`、`articleUrl`、`link`：来源与原文地址。
- `sourceRefs`：从来源文章提取或整理的补充链接候选，不保证全部为发布机构原文；旧记录的日期可能沿用报道日期，不应当作被引文档的发布日期。
- `zones`：所属知识专区。

### 内容详情

```http
GET /api/v1/public/contents/src-1xkvysg
GET /api/v1/public/contents/src-1xkvysg?includeBody=true
```

`includeBody=true` 时额外返回已保存的 `body` 与 `bodyZh`。

### 日报、专区和运行状态

```http
GET /api/v1/public/daily
GET /api/v1/public/zones
GET /api/v1/public/status
```

### 气候风险参考数据（公共）

`/api/v1/public/climate-risk`需要lat、lon、scenario、window、variable。scenario接受ssp126/ssp245/ssp585；window可传2021–2040、2041–2060、2081–2100，但当前只有2041–2060已预计算；variable固定tasmax。坐标按已验证0.25°格点匹配，当前仅上海ssp126/ssp245两组完整，鹿特丹和ssp585未完成，返回unavailable。调用不触发外部下载。

可用返回ok:true、status:available、record（20年baseline/future逐年计数）、summary（baselineMean/futureMean/change/gridLatitude/gridLongitude）、provenance（数据集/版本/模型/成员/许可/阈值/来源）。仅代表单模型条件投影，不是观测或厂址损失。未覆盖地点或时间窗返回200且status:unavailable，无数值；参数错误400，快照故障503。浏览器须同时检查HTTP状态与status字段。支持OPTIONS、公共CORS和已有API限流。

## 鉴权 API（业务内容）

私有接口路径与公共接口相同，但不含 `/public`：

```text
https://esg-compass-ai.vercel.app/api/v1/contents
```

请求头支持以下任一形式：

```http
Authorization: Bearer YOUR_API_KEY
```

```http
X-API-Key: YOUR_API_KEY
```

私有接口需要在本地 `.env.local` 和 Vercel 项目中配置同名环境变量：

```text
ESG_API_KEY
```

密钥只应保存在工作平台的服务端或密钥管理系统中，不要放入浏览器前端代码。

## 工作平台示例

```ts
const response = await fetch(
  "https://esg-compass-ai.vercel.app/api/v1/public/contents?curated=true&pageSize=10",
);

if (!response.ok) {
  throw new Error(`ESG Compass API ${response.status}`);
}

const payload = await response.json();
for (const item of payload.items) {
  console.log(item.displayTitle, item.displaySummary, item.reason, item.link);
}
```

增量轮询时建议每 30 至 60 分钟请求一次，并在 `since` 中使用最近 24 小时的游标，避免遗漏晚发布或后补录的内容。

## 响应约定

- 成功响应包含 `ok: true`。
- 列表使用 `pagination` 返回分页信息。
- 未找到返回 `404`。
- 鉴权失败返回 `401`。
- 服务端未配置私有密钥返回 `503`。
- 公开接口只返回通过评分与摘要质量门槛的内容。
- 公开内容资格同时排除纯会议出席、行程、日程及缺少实质 ESG 内容的会务报道；历史评分较高或来源为官方也不能绕过。具体会议成果和有证据的争议继续正常评分，响应字段不变。

## 2026-11-19：事项进展快照

公开内容 API 的响应字段和筛选不变。本批事项进展仅由服务端页面读取 `data/publication/event-progress.json`（version 1），通过 contentId 引用既有公开合格内容，事件详情与知识专区共用查询。没有新增接口或自动写入任务；常规采集发布不覆盖人工维护的事项文件。快照缺失或版本不支持时不显示进展模块，不回退旧内容。运营 schema 与维护步骤见 `EVENT_PROGRESS_TECHNICAL_PLAN.md`。

## 发布机构文档与解读关联

事项快照 version 1 扩展可选 `policy`（issuer、issuerHost、document、insights）。仅服务端详情页使用，不自动暴露为公开 API 字段。来源文章与官方文档分别标注；解读只引用通过公开资格校验的 contentId，不从 sourceRefs 或故事簇自动推导。`trace:upstream` 新提取链接不再继承报道发布时间，并接纳 PDF 候选；新旧链接均需核验后才可成为政策官方原文。数据结构、更新流程和首批证据见 `POLICY_SOURCE_AND_INSIGHT_PLAN.md`。

2026-11-20：policy 可选增加 eventIds，明确政策事件成员；双向查询不依赖进展节点有效。insights 反向解析为对应政策，可返回多个明确关联，始终排除不合格内容；详情列表不推荐当前文章自身。公开 API 响应未增加字段。按用户最终确认，政策页与解读页均直接展示已收录进展，专区事项入口统一使用 #event-progress；#policy-context 保留用于定位官方文档。
