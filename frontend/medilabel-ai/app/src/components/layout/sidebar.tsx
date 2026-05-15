"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../icon";
import { useTheme } from "../../context/theme-context";

function SidebarItem({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}) {
  const { dark } = useTheme();
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-4 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${
          active
            ? dark
              ? "bg-[#2f4e33]/40 text-[#acd0ad]"
              : "bg-[#c8ecc8] text-[#2f4e33]"
            : dark
              ? "text-slate-300 hover:bg-slate-700/60 hover:text-white"
              : "text-[#424841] hover:bg-[#eeeeea] hover:text-[#1a1c1a]"
        }`}
    >
      <Icon name={icon} className="text-[18px] flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { dark } = useTheme();

  const surface = dark ? "bg-slate-800" : "bg-white";
  const border = dark ? "border-slate-700" : "border-[#c2c8bf]";
  const heading = dark ? "text-white" : "text-[#1a1c1a]";

  return (
    <aside
      className={`hidden md:flex w-64 flex-col border-r ${surface} ${border} transition-colors duration-200`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-6 py-4 border-b ${border}`}>
        <span className={dark ? "text-[#acd0ad]" : "text-[#37563b]"}>
          <Icon name="computer" className="text-[22px]" />
        </span>
        <span className={`font-bold text-base tracking-tight ${heading}`}>
          MediLabel
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 p-3">
        <SidebarItem icon="dashboard" label="Dashboard" href="/dashboard" />
        <SidebarItem icon="pill" label="Medication" href="/health_products" />
        <SidebarItem icon="exercise" label="Workouts" href="/workouts" />
        <SidebarItem icon="monitor_weight" label="Body Metrics" href="/body_metrics" />
        <SidebarItem icon="settings" label="Settings" href="/settings" />
      </nav>

      {/* Footer */}
      <div className={`mt-auto p-3 border-t ${border}`}>
        <SidebarItem icon="logout" label="Logout" href="/logout" />
      </div>
    </aside>
  );
}
