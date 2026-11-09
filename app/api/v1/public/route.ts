import { apiJson, apiOptions } from "@/lib/api/v1";

export const dynamic = "force-dynamic";

const options = { requireAuth: false };

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return apiJson({
    ok: true,
    name: "ESG Compass Public API",
    version: "1.0",
    description: "只读 ESG 事件、精选摘要、日报与知识专区接口",
    endpoints: {
      contents: `${origin}/api/v1/public/contents`,
      detail: `${origin}/api/v1/public/contents/{id}`,
      daily: `${origin}/api/v1/public/daily`,
      zones: `${origin}/api/v1/public/zones`,
      status: `${origin}/api/v1/public/status`,
    },
    filters: ["q", "contentType", "curated", "since", "zone", "page", "pageSize"],
    contentTypeValues: ["政策", "行业", "观点", "学术", "评级", "policy", "industry", "opinion", "academic", "rating"],
  }, options);
}

export function OPTIONS() {
  return apiOptions();
}
