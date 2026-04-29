"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { useTheme } from "../../context/theme-context";

export default function AppLayout({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { dark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`flex min-h-screen ${dark ? "bg-neutral-950" : "bg-[#F5F3EE]"} transition-colors duration-200`}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
