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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        "border max-h-7",
        toneClasses,
        className,
      )}
      aria-label={ariaLabel}
    >
      <Icon
        className="mr-1.5 h-[18px] w-[18px] stroke-[1.75] md:h-4 md:w-4"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
