"use client";

import { useTheme } from "../context/theme-context";

export default function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  const { dark } = useTheme();
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-semibold ${dark ? "text-white" : "text-[#1a1c1a]"}`}
    >
      {children}
    </label>
  );
}
