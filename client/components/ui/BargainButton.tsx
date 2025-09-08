import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addMobileTouchOptimizations,
  hapticFeedback,
  isMobileDevice,
} from "@/lib/mobileUtils";
import { Sparkles, TrendingDown } from "lucide-react";
import EnhancedMobileBargainModal from "@/components/mobile/EnhancedMobileBargainModal";

interface BargainButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  icon?: boolean;
  // Enhanced bargain props
  module?: 'flights' | 'hotels' | 'sightseeing' | 'transfers';
  itemName?: string;
  supplierNetRate?: number;
  itemDetails?: {
    features?: string[];
    location?: string;
    provider?: string;
  };
  promoCode?: string;
  onBargainSuccess?: (finalPrice: number, savings: number) => void;
  useEnhancedModal?: boolean;
}

export function BargainButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  size = "md",
  icon = true,
  // Enhanced bargain props
  module = 'hotels',
  itemName = '',
  supplierNetRate = 0,
  itemDetails = {},
  promoCode,
  onBargainSuccess,
  useEnhancedModal = false,
  // Extract only valid DOM props, filter out component-specific props
  id,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  ...domProps
}: BargainButtonProps & {
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  [key: string]: any;
}) {
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) return;

    // Haptic feedback for mobile devices
    if (isMobileDevice()) {
      hapticFeedback("light");
    }

    // Use enhanced modal if enabled and required props are provided
    if (useEnhancedModal && itemName && supplierNetRate > 0) {
      setIsEnhancedModalOpen(true);
    } else {
      onClick?.(e);
    }
  };

  const handleEnhancedBargainSuccess = (finalPrice: number, savings: number) => {
    setIsEnhancedModalOpen(false);
    onBargainSuccess?.(finalPrice, savings);
  };

  React.useEffect(() => {
    // Add mobile touch optimizations when component mounts
    const buttonElement = document.querySelector(
      ".bargain-button-locked",
    ) as HTMLElement;
    if (buttonElement && isMobileDevice()) {
      addMobileTouchOptimizations(buttonElement);
    }
  }, []);

  const sizeClasses = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[44px]",
    lg: "px-8 py-4 text-lg min-h-[48px]",
  };

  return (
    <>
      <button
      className={cn(
        // Base styles with className override support
        !className.includes("bg-") &&
          "bg-gradient-to-br from-[#febb02] to-[#f4a902]",
        !className.includes("text-") && "text-black",
        !className.includes("rounded") && "rounded-full",
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
        !className.includes("shadow") && "shadow-lg shadow-yellow-200/30",
        !className.includes("min-h") && sizeClasses[size],
        className,
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      type="button"
      id={id}
      data-testid={dataTestId}
      aria-label={ariaLabel || (typeof children === 'string' ? children : 'Bargain button')}
    >
      {/* Shimmer Effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
          transform: "translateX(-100%)",
          animation: "shimmer 2s infinite",
        }}
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
      )}

      {/* Icon */}
      {icon && !loading && (useEnhancedModal ? <TrendingDown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}

      {/* Button Text */}
      <span className="relative z-10 font-bold">{children}</span>

      {/* Ripple effect container */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-0 transform scale-0 transition-all duration-300 hover:opacity-20 hover:scale-100" />
      </div>

      </button>

      {/* Enhanced Bargain Modal */}
      {useEnhancedModal && (
        <EnhancedMobileBargainModal
          isOpen={isEnhancedModalOpen}
          onClose={() => setIsEnhancedModalOpen(false)}
          onBargainSuccess={handleEnhancedBargainSuccess}
          module={module}
          itemName={itemName}
          supplierNetRate={supplierNetRate}
          itemDetails={itemDetails}
          promoCode={promoCode}
        />
      )}
    </>
  );
}

// Convenience exports for different sizes
export function BargainButtonSmall(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="sm" {...props} />;
}

export function BargainButtonLarge(props: Omit<BargainButtonProps, "size">) {
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
