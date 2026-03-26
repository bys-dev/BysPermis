import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dark-primary"
  | "dark-secondary"
  | "dark-ghost";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger:
    "inline-flex items-center justify-center font-semibold rounded-[var(--radius-sm)] bg-danger text-white transition-all duration-200 ease-in-out hover:bg-red-700 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)]",
  "dark-primary": "dark-btn",
  "dark-secondary": "dark-btn-secondary",
  "dark-ghost": "dark-btn-ghost",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-6 py-3 text-base gap-2",
  lg: "px-8 py-4 text-lg gap-2.5",
};

const isDark = (v: ButtonVariant) => v.startsWith("dark-");

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      {...rest}
    >
      {loading && (
        <Spinner size="sm" dark={isDark(variant)} className="shrink-0" />
      )}
      {children}
    </button>
  );
}
