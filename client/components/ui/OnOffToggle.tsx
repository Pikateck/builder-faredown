import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
};

export default function OnOffToggle({ checked, onChange, size = "md", disabled, className }: Props) {
  const dims =
    size === "sm"
      ? { track: "h-5 w-10", thumb: "h-4 w-4", translate: "translate-x-5", label: "text-[10px]" }
      : { track: "h-6 w-12", thumb: "h-5 w-5", translate: "translate-x-6", label: "text-[11px]" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !disabled) {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        "relative inline-flex items-center justify-start rounded-full border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300",
        checked ? "bg-emerald-500 border-emerald-600" : "bg-slate-200 border-slate-300",
        dims.track,
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      )}
      title={checked ? "ON" : "OFF"}
    >
      {/* Label */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold uppercase pointer-events-none",
          dims.label,
          checked ? "text-white" : "text-slate-400",
        )}
      >
        {checked ? "ON" : "OFF"}
      </span>

      {/* Thumb */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 rounded-full bg-white shadow-sm transition-transform duration-200",
          dims.thumb,
          checked ? dims.translate : "translate-x-0",
        )}
      />
    </button>
  );
}
