import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Standup from "@/models/Standup";
import Activity from "@/models/Activity";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const all = searchParams.get("all") === "true";

  if (all) {
    const standups = await Standup.find({ date }).sort({ createdAt: -1 });
    return NextResponse.json({
      standups: standups.map((s) => ({
        id: s._id.toString(),
        userId: s.userId.toString(),
        userName: s.userName,
        yesterday: s.yesterday,
        today: s.today,
        blockers: s.blockers,
        date: s.date,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  }

  const standup = await Standup.findOne({ userId: session.id, date });
  return NextResponse.json({
    standup: standup
      ? {
          id: standup._id.toString(),
          userId: standup.userId.toString(),
          userName: standup.userName,
          yesterday: standup.yesterday,
          today: standup.today,
          blockers: standup.blockers,
          date: standup.date,
          createdAt: standup.createdAt.toISOString(),
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const body = await request.json();
  const { yesterday, today, blockers } = body;

  if (!yesterday?.trim() || !today?.trim()) {
    return NextResponse.json({ error: "Yesterday and today are required" }, { status: 400 });
  }

  await connectDB();
  const date = new Date().toISOString().split("T")[0];

  const standup = await Standup.findOneAndUpdate(
    { userId: session.id, date },
    { yesterday: yesterday.trim(), today: today.trim(), blockers: blockers?.trim() ?? "", userName: session.name },
    { upsert: true, new: true }
  );

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: "submitted daily standup",
    entity: "standup",
    entityId: standup._id.toString(),
  });

  return NextResponse.json({
    standup: {
      id: standup._id.toString(),
      userId: standup.userId.toString(),
      userName: standup.userName,
      yesterday: standup.yesterday,
      today: standup.today,
      blockers: standup.blockers,
      date: standup.date,
      createdAt: standup.createdAt.toISOString(),
    },
  });
}
