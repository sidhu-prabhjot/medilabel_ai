"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../src/context/theme-context";
import Icon from "../src/components/icon";
import api from "../src/api/axios";

export default function LogoutPage() {
  const router = useRouter();
  const { dark } = useTheme();

  useEffect(() => {
    // Tell the backend to delete the refresh token from the DB and clear cookies.
    // We redirect regardless — if the API call fails, the user is still sent to login.
    api.post("/api/auth/logout").finally(() => {
      router.push("/");
    });
  }, [router]);

  return (
    <div
      className={`flex min-h-screen items-center justify-center transition-colors duration-200 ${
        dark ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <Icon
          name="logout"
          className={`text-4xl ${dark ? "text-slate-400" : "text-slate-500"}`}
        />
        <p
          className={`text-sm font-medium ${
            dark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Signing out…
        </p>
      </div>
    </div>
  );
}
