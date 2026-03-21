"use client";

import Icon from "../icon";
import { useTheme } from "../../context/theme-context";

export default function Navbar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick?: () => void;
}) {
  const { dark, toggle } = useTheme();

  const surface = dark ? "bg-slate-800" : "bg-white";
  const border = dark ? "border-slate-700" : "border-slate-200";
  const heading = dark ? "text-white" : "text-slate-900";

  return (
    <header
      className={`h-16 border-b ${surface} ${border} flex items-center justify-between px-6 transition-colors duration-200`}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button onClick={onMenuClick} className="md:hidden">
          <Icon name="menu" className="text-[22px]" />
        </button>
        <h1 className={`text-base font-semibold ${heading}`}>{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            dark
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Icon name={dark ? "sunny" : "bedtime"} className="text-[18px]" />
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            dark
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Icon name="notifications" className="text-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            dark
              ? "bg-indigo-500/30 text-indigo-300"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          ML
        </div>
      </div>
    </header>
  );
}
