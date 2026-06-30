import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const sessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar ?? "",
    };

    const token = await createToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    setAuthCookie(response, token);

    // Log activity
    await Activity.create({
      userId: user._id,
      userName: user.name,
      action: "logged in",
      entity: "user",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
