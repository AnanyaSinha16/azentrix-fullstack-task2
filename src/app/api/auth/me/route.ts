import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return NextResponse.json({ user: session });
}
