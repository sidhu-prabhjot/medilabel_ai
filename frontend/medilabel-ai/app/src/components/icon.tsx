import "material-symbols";

export default function Icon({
  name,
  className = "text-[20px]",
  variant = "outlined",
}: {
  name: string;
  className?: string;
  variant?: "outlined" | "sharp";
}) {
  return (
    <span
      className={`material-symbols-${variant} leading-none select-none ${className}`}
    >
      {name}
    </span>
  );
}
