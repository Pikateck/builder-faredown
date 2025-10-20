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
        "relative inline-flex items-center border-2 transition-colors duration-200 rounded-xl",
        // Green when ON, Red when OFF
        checked ? "bg-emerald-600 border-emerald-600" : "bg-red-600 border-red-600",
        dims.track,
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      title={checked ? "ON" : "OFF"}
    >
      {/* Labels */}
      <span className={cn("relative z-20 flex w-full items-center justify-between px-2 select-none font-semibold uppercase", dims.text)}>
        <span className={cn(checked ? "text-white" : "text-white/0")}>On</span>
        <span className={cn(checked ? "text-white/0" : "text-white")}>Off</span>
      </span>

      {/* Thumb */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-lg bg-white shadow transition-transform duration-200 z-10",
          dims.thumb,
          checked ? dims.translate : "translate-x-0",
        )}
      />
    </button>
  );
}
