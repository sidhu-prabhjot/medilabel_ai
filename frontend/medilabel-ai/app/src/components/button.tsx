type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function Button({
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        flex w-full justify-center rounded-md
        bg-[#37563b] px-3 py-1.5
        text-sm font-semibold text-white
        hover:bg-[#4f6f52]
        transition
        ${className}
      `}
    >
      {children}
    </button>
  );
}
