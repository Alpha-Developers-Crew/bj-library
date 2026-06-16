import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("token");
  return response;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return NextResponse.redirect(new URL("/login", request.url));
}
