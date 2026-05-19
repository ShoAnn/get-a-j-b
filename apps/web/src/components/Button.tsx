import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#7F77DD] text-white hover:bg-[#6B63C9] active:bg-[#5A52B8] disabled:bg-[#B8B4E8]",
  secondary:
    "bg-transparent text-[#7F77DD] border border-[#7F77DD] hover:bg-[#F5F3FF] active:bg-[#EBE9FA] disabled:text-[#B8B4E8] disabled:border-[#B8B4E8]",
  ghost:
    "bg-transparent text-[#1A1A2E] hover:bg-[#F5F3FF] active:bg-[#EBE9FA] disabled:text-[#B8B4E8]",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-[10px] text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
