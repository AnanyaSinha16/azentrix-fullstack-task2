import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized, createToken, setAuthCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const body = await request.json();
  const { name, avatar, currentPassword, newPassword } = body;

  const user = await User.findById(session.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    user.password = newPassword; // pre-save hook will hash
  }

  await user.save();

  const updatedSession = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar ?? "",
  };

  const token = await createToken(updatedSession);
  const response = NextResponse.json({
    user: { id: updatedSession.id, email: updatedSession.email, name: updatedSession.name, role: updatedSession.role, avatar: updatedSession.avatar },
  });
  setAuthCookie(response, token);

  return response;
}
