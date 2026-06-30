import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");

  const skip = (page - 1) * limit;
  const total = await Activity.countDocuments();
  const activities = await Activity.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return NextResponse.json({
    activities: activities.map((a) => ({
      id: a._id.toString(),
      userId: a.userId.toString(),
      userName: a.userName,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      entityName: a.entityName,
      boardId: a.boardId,
      boardName: a.boardName,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
