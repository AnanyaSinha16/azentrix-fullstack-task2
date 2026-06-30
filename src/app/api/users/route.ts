import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized, forbidden } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (session.role !== "admin") return forbidden();

  await connectDB();
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar ?? "",
      createdAt: u.createdAt.toISOString(),
    })),
  });
}
