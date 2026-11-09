import { apiOptions, handleContentDetail } from "@/lib/api/v1";

export const dynamic = "force-dynamic";

const options = { requireAuth: true };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleContentDetail(request, decodeURIComponent(id), options);
}

export function OPTIONS() {
  return apiOptions();
}
