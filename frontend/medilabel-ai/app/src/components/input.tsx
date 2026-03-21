type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        block w-full rounded-md
        px-3 py-1.5
        text-base
        border border-gray-300
        outline-none
        focus:ring-2 focus:ring-indigo-500
        ${className}
      `}
    />
  );
}
