import { apiOptions, handleContentsRequest } from "@/lib/api/v1";

export const dynamic = "force-dynamic";

const options = { requireAuth: false };

export async function GET(request: Request) {
  return handleContentsRequest(request, options);
}

export function OPTIONS() {
  return apiOptions();
}
