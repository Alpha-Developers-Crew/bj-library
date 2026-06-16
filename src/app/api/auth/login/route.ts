import { login } from "@/lib/actions/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await login(body.username, body.password);

  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
