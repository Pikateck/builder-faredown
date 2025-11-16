import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function InfoChip({
  icon: Icon,
  children,
  tone = "default",
  className,
  ariaLabel,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  tone?: "default" | "success" | "danger";
  className?: string;
  ariaLabel?: string;
}) {
  const toneClasses = {
    default: "bg-neutral-50 text-neutral-700 border-neutral-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        "border max-h-6",
        toneClasses,
        className,
      )}
      aria-label={ariaLabel}
    >
      <Icon
        className="mr-1 h-3.5 w-3.5 stroke-[1.75] md:h-3.5 md:w-3.5"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
