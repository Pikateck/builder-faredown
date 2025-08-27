import React from "react";
import { cn } from "@/lib/utils";

interface FaredownLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
}

/**
 * FareDown Logo Component
 * 
 * Implements FareDown brand guidelines:
 * - Primary Logo: 'faredown.com' text in white + yellow lightning triangle icon
 * - Always lowercase text: 'faredown.com'
 * - Consistent styling across applications
 * - Never stretch, crop, distort, or change colors
 */
export function FaredownLogo({ 
  className = "",
  size = "md",
  showText = true,
  textClassName = ""
}: FaredownLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl"
  };

  return (
    <div className="flex items-center">
      <img
        src="/logo/faredown-logo.png"
        alt="Faredown Logo"
        className={cn("object-contain",
          size === 'sm' ? 'h-6' : size === 'md' ? 'h-8' : 'h-12',
          className
        )}
      />
    </div>
  );
}
