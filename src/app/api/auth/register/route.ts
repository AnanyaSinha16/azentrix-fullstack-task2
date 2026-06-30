import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // First user becomes admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "member";

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role,
      avatar: "",
    });

    const sessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar ?? "",
    };

    const token = await createToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser }, { status: 201 });
    setAuthCookie(response, token);

    await Activity.create({
      userId: user._id,
      userName: user.name,
      action: "joined the team",
      entity: "user",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
