import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { BoardsList } from "@/components/BoardsList";

export default async function BoardsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Your boards</h1>
        <BoardsList />
      </main>
    </div>
  );
}
