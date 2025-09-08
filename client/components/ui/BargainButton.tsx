import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addMobileTouchOptimizations,
  hapticFeedback,
  isMobileDevice,
} from "@/lib/mobileUtils";
import { TrendingDown } from "lucide-react";
import { ConversationalBargainModal } from "@/components/ConversationalBargainModal";

interface BargainButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
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
  isMobile?: boolean;
}

export function BargainButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  size = "md",
  // Enhanced bargain props
  module = 'hotels',
  itemName = '',
  supplierNetRate = 0,
  itemDetails = {},
  promoCode,
  onBargainSuccess,
  useEnhancedModal = false,
  isMobile = false,
  // Extract only valid DOM props
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

    e.preventDefault();
    e.stopPropagation();

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

  // Original working classes from backup
  const mobileClasses = "flex-1 py-4 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200";
  const desktopClasses = "text-sm px-5 py-3 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold flex items-center gap-2 min-h-[44px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200";
  
  // Use size variants for backward compatibility
  const sizeClasses = {
    sm: "text-sm px-4 py-2 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold flex items-center gap-2 min-h-[40px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200",
    md: desktopClasses,
    lg: "text-lg px-6 py-4 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold flex items-center gap-2 min-h-[48px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200",
  };

  // Determine which classes to use
  let buttonClasses = className || (isMobile ? mobileClasses : sizeClasses[size]);

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(buttonClasses)}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        id={id}
        data-testid={dataTestId}
        aria-label={ariaLabel || (typeof children === 'string' ? children : 'Bargain button')}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
        )}

        {/* Icon - Always TrendingDown as per backup */}
        {!loading && <TrendingDown className="w-4 h-4" />}

        {/* Button Text */}
        {children}
      </Button>

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

// Mobile variant with explicit mobile styling
export function BargainButtonMobile(props: Omit<BargainButtonProps, "isMobile">) {
  return <BargainButton isMobile={true} {...props} />;
}

export default BargainButton;
