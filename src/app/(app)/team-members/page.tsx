import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { TeamMembersClient } from "./TeamMembersClient";

export default async function TeamMembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  await connectDB();

  const users = await User.find().sort({ createdAt: -1 }).lean();

  const serializedUsers = users.map((u: any) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar ?? "",
    createdAt: u.createdAt?.toISOString() ?? "",
  }));

  return (
    <TeamMembersClient
      initialUsers={serializedUsers}
      currentUser={session}
    />
  );
}
