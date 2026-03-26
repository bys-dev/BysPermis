import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "text" | "avatar" | "rect";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantDefaults: Record<
  SkeletonVariant,
  { className: string; width?: string; height?: string }
> = {
  card: {
    className: "rounded-[var(--radius-md)]",
    width: "100%",
    height: "200px",
  },
  text: {
    className: "rounded-[var(--radius-sm)]",
    width: "100%",
    height: "16px",
  },
  avatar: {
    className: "rounded-full",
    width: "48px",
    height: "48px",
  },
  rect: {
    className: "rounded-[var(--radius-sm)]",
    width: "100%",
    height: "100px",
  },
};

export function Skeleton({
  variant = "rect",
  width,
  height,
  className,
}: SkeletonProps) {
  const defaults = variantDefaults[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-brand-border/40",
        defaults.className,
        className,
      )}
      style={{
        width: width ?? defaults.width,
        height: height ?? defaults.height,
      }}
    />
  );
}
