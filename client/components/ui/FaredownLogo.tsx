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
    <div className="flex items-center space-x-2">
      <div className={cn("flex items-center justify-center", sizeClasses[size])}>
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb3ece29408ce4d279de7e81ec4937a79?format=webp&width=800"
          alt="FareDown Logo"
          className={cn(sizeClasses[size], "object-contain", className)}
        />
      </div>
      {showText && (
        <span 
          className={cn(
            textSizeClasses[size],
            "font-bold tracking-tight",
            textClassName
          )}
        >
          faredown.com
        </span>
      )}
    </div>
  );
}
