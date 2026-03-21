import { useTheme } from "../context/theme-context";

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { dark } = useTheme();

  return (
    <div
      className={`rounded-xl border p-5 transition-colors duration-200 ${
        dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      } ${className}`}
    >
      {children}
    </div>
  );
}
