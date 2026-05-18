"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "./src/api/auth.api";
import { useTheme } from "./src/context/theme-context";
import Input from "./src/components/input";
import Label from "./src/components/label";
import Button from "./src/components/button";

export default function Home() {
  const router = useRouter();
  const { dark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(", ")
        : detail || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-200 ${
        dark ? "bg-neutral-950" : "bg-[#F5F3EE]"
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl shadow-sm p-8 ${
          dark ? "bg-slate-800" : "bg-white"
        }`}
      >
        {/* Logo + branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#37563b] flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-white fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.5 2.25a.75.75 0 0 0-1.5 0V4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5A2.25 2.25 0 0 0 6.75 19.5h10.5A2.25 2.25 0 0 0 19.5 17.25V6.75A2.25 2.25 0 0 0 17.25 4.5H15V2.25a.75.75 0 0 0-1.5 0V4.5h-3V2.25ZM9 9.75A.75.75 0 0 1 9.75 9h4.5a.75.75 0 0 1 0 1.5h-1.5v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5H9.75A.75.75 0 0 1 9 9.75Z" />
            </svg>
          </div>
          <h1
            className={`text-xl font-bold tracking-tight ${
              dark ? "text-white" : "text-[#1a1c1a]"
            }`}
          >
            MediLabel AI
          </h1>
          <p
            className={`text-sm mt-1 ${
              dark ? "text-slate-400" : "text-[#424841]"
            }`}
          >
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email">Email address</Label>
            <div className="mt-1.5">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="mt-1.5">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {/* Footer link */}
        <p
          className={`mt-6 text-center text-sm ${
            dark ? "text-slate-400" : "text-[#424841]"
          }`}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className={`font-semibold ${
              dark ? "text-[#acd0ad] hover:text-[#c8ecc8]" : "text-[#37563b] hover:text-[#4f6f52]"
            }`}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
