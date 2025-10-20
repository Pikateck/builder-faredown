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
      ? { track: "h-6 w-12", thumb: "h-5 w-5", translate: "translate-x-6", text: "text-[10px]" }
      : { track: "h-7 w-14", thumb: "h-6 w-6", translate: "translate-x-7", text: "text-[11px]" };

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
        "relative inline-flex items-center rounded-full border transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300",
        checked ? "bg-emerald-500" : "bg-slate-300",
        "border-slate-300",
        dims.track,
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className,
      )}
      title={checked ? "ON" : "OFF"}
    >
      {/* Labels: left=ON, right=OFF, kept above thumb for readability */}
      <span className={cn("relative z-20 flex w-full items-center justify-between px-1 select-none uppercase font-semibold", dims.text)}>
        <span className={cn(checked ? "text-white" : "text-white/70")}>On</span>
        <span className={cn(checked ? "text-emerald-100/0" : "text-slate-700")}>Off</span>
      </span>

      {/* Thumb */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform duration-200 z-10",
          dims.thumb,
          checked ? dims.translate : "translate-x-0",
        )}
      />
    </button>
  );
}
