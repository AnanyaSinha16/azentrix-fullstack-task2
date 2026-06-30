"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-white/80 mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/30 mb-4">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Join TaskFlow Pro</h1>
          <p className="text-slate-400 mt-2 text-sm">Create your team workspace</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className={labelClass}>Full name</label>
              <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Siva Sai" className={inputClass} />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputClass} />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className={inputClass} />
            </div>

            <div>
              <label htmlFor="confirm" className={labelClass}>Confirm password</label>
              <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="register-btn"
              className="w-full btn-primary btn-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </span>
              ) : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-white/30">
            The first user to register becomes the Admin.
          </p>
        </div>
      </div>
    </div>
  );
}
