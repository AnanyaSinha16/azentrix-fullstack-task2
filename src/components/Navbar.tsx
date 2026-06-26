"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionUser } from "@/types";

interface NavbarProps {
  user: SessionUser;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/boards" className="text-lg font-semibold text-brand-700">
          Azentrix Kanban
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {user.name}{" "}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase">
              {user.role}
            </span>
          </span>
          {user.role === "ADMIN" && (
            <Link href="/admin" className="text-sm text-brand-600 hover:underline">
              Admin
            </Link>
          )}
          <button onClick={logout} className="btn-secondary">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
