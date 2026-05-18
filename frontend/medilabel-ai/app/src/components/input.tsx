type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        block w-full rounded-md
        px-3 py-1.5
        text-base text-[#1a1c1a]
        border border-gray-300
        outline-none
        placeholder:text-gray-400
        focus:ring-2 focus:ring-[#37563b]
        ${className}
      `}
    />
  );
}
