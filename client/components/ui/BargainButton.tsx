import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addMobileTouchOptimizations, hapticFeedback, isMobileDevice } from "@/lib/mobileUtils";
import { Sparkles } from "lucide-react";

interface BargainButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  icon?: boolean;
}

export function BargainButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  size = "md",
  icon = true,
  ...props
}: BargainButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) return;
    
    // Haptic feedback for mobile devices
    if (isMobileDevice()) {
      hapticFeedback("light");
    }
    
    onClick?.(e);
  };

  React.useEffect(() => {
    // Add mobile touch optimizations when component mounts
    const buttonElement = document.querySelector('.bargain-button-locked') as HTMLElement;
    if (buttonElement && isMobileDevice()) {
      addMobileTouchOptimizations(buttonElement);
    }
  }, []);

  const sizeClasses = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[44px]",
    lg: "px-8 py-4 text-lg min-h-[48px]"
  };

  return (
    <button
      className={cn(
        // Base styles - locked and cannot be overridden
        "bargain-button-locked",
        "relative overflow-hidden",
        "inline-flex items-center justify-center gap-2",
        "font-bold tracking-wide",
        "transition-all duration-300 ease-out",
        "transform-gpu", // Use GPU acceleration
        "touch-manipulation", // Better touch handling
        "focus:outline-none focus:ring-4 focus:ring-yellow-200 focus:ring-opacity-50",
        "active:scale-95", // Press animation
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        "hover:scale-105 hover:shadow-xl",
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        // CSS variables for golden gradient - locked styles
        "--bargain-bg-start": "#febb02",
        "--bargain-bg-end": "#f4a902", 
        "--bargain-text": "#000000",
        "--bargain-radius": "9999px",
        // Apply locked styles directly
        background: "linear-gradient(135deg, var(--bargain-bg-start), var(--bargain-bg-end))",
        color: "var(--bargain-text)",
        borderRadius: "var(--bargain-radius)",
        boxShadow: "0 10px 25px -3px rgb(254 187 2 / 0.3), 0 4px 6px -2px rgb(254 187 2 / 0.1)",
      }}
      {...props}
    >
      {/* Shimmer Effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
          transform: "translateX(-100%)",
          animation: "shimmer 2s infinite"
        }}
      />
      
      {/* Loading Spinner */}
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
      )}
      
      {/* Icon */}
      {icon && !loading && (
        <Sparkles className="w-4 h-4" />
      )}
      
      {/* Button Text */}
      <span className="relative z-10 font-bold">
        {children}
      </span>
      
      {/* Ripple effect container */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-0 transform scale-0 transition-all duration-300 hover:opacity-20 hover:scale-100" />
      </div>

      {/* Additional CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .bargain-button-locked::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transform: translateX(-100%);
          transition: transform 0.7s ease-out;
          z-index: 1;
        }
        
        .bargain-button-locked:hover::before {
          transform: translateX(100%);
        }
        
        /* Pulse animation for special states */
        .bargain-button-pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 10px 25px -3px rgb(254 187 2 / 0.3), 0 4px 6px -2px rgb(254 187 2 / 0.1);
          }
          50% {
            box-shadow: 0 15px 35px -3px rgb(254 187 2 / 0.5), 0 8px 15px -2px rgb(254 187 2 / 0.3);
          }
          100% {
            box-shadow: 0 10px 25px -3px rgb(254 187 2 / 0.3), 0 4px 6px -2px rgb(254 187 2 / 0.1);
          }
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .bargain-button-locked {
            min-height: 44px; /* iOS accessibility guidelines */
            min-width: 44px;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          .bargain-button-locked {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
          
          .bargain-button-locked::before {
            display: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bargain-button-locked {
            border: 2px solid currentColor;
          }
        }
      `}</style>
    </button>
  );
}

// Convenience exports for different sizes
export function BargainButtonSmall(props: Omit<BargainButtonProps, 'size'>) {
  return <BargainButton size="sm" {...props} />;
}

export function BargainButtonLarge(props: Omit<BargainButtonProps, 'size'>) {
  return <BargainButton size="lg" {...props} />;
}

// Specialized variants
export function BargainButtonPulse(props: BargainButtonProps) {
  return (
    <BargainButton 
      {...props} 
      className={cn("bargain-button-pulse", props.className)}
    />
  );
}

export default BargainButton;
