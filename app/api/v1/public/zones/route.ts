import { apiOptions, handleZones } from "@/lib/api/v1";

export const dynamic = "force-dynamic";

const options = { requireAuth: false };

export function GET(request: Request) {
  return handleZones(request, options);
}

export function OPTIONS() {
  return apiOptions();
}
