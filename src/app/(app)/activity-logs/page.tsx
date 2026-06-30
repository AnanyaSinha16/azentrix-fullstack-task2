import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { ActivityLogsClient } from "./ActivityLogsClient";

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  await connectDB();

  const page = parseInt(searchParams.page ?? "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(),
  ]);

  const serializedActivities = activities.map((a: any) => ({
    id: a._id.toString(),
    userId: a.userId.toString(),
    userName: a.userName,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId ?? "",
    entityName: a.entityName ?? "",
    boardId: a.boardId ?? "",
    boardName: a.boardName ?? "",
    createdAt: a.createdAt?.toISOString() ?? "",
  }));

  const totalPages = Math.ceil(total / limit);

  return (
    <ActivityLogsClient
      initialActivities={serializedActivities}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
