import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { Navbar } from "@/components/Navbar";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session)) redirect("/boards");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/boards" className="text-sm text-brand-600 hover:underline">
          ← Back to boards
        </Link>
        <h1 className="mb-2 mt-2 text-3xl font-bold text-slate-900">User management</h1>
        <p className="mb-6 text-slate-600">
          Admins can promote users, remove accounts, and edit any card on the board.
        </p>
        <AdminPanel />
      </main>
    </div>
  );
}
