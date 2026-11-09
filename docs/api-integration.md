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
- `sourceRefs`：已溯源到的一手信源。
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

## 鉴权 API

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
