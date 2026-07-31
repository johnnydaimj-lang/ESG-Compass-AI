import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = (await cookies()).get("admin_session");
    return NextResponse.json({ authenticated: session?.value === "true" });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
