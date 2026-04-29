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
      className={`rounded-xl border p-5 transition-colors duration-200 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
        dark
          ? "bg-neutral-900 border-neutral-800"
          : "bg-white border-[#DAD7CD]/40"
      } ${className}`}
    >
      {children}
    </div>
  );
}
