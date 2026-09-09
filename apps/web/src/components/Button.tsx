import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-violet text-white hover:bg-violet-hover active:bg-violet-active disabled:bg-violet-disabled",
  secondary:
    "bg-transparent text-violet border border-violet hover:bg-violet-subtle active:bg-violet-subtle-active disabled:text-violet-disabled disabled:border-violet-disabled dark:hover:bg-midnight-active dark:active:bg-midnight-hover",
  ghost:
    "bg-transparent text-foreground hover:bg-violet-subtle active:bg-violet-subtle-active disabled:text-violet-disabled dark:hover:bg-midnight-active dark:active:bg-midnight-hover",
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
