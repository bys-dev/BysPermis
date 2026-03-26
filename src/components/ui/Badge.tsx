import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant =
  | "qualiopi"
  | "cpf"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  qualiopi: "badge badge-qualiopi",
  cpf: "badge badge-cpf",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  info: "badge badge-info",
  default: "badge bg-gray-100 text-gray-600",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(variantClasses[variant], className)}>
      {children}
    </span>
  );
}
