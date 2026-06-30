import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized, forbidden } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (session.role !== "admin") return forbidden();

  await connectDB();
  const body = await request.json();
  const { role } = body;

  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(params.id, { role }, { new: true }).select("-password");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: `changed ${user.name}'s role to ${role}`,
    entity: "user",
    entityId: user._id.toString(),
    entityName: user.name,
  });

  return NextResponse.json({
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (session.role !== "admin") return forbidden();

  // Prevent self-deletion
  if (params.id === session.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: `removed ${user.name} from the team`,
    entity: "user",
    entityName: user.name,
  });

  return NextResponse.json({ success: true });
}
