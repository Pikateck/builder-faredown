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
  // Bargain props for ConversationalBargainModal
  module?: 'flights' | 'hotels' | 'sightseeing' | 'transfers';
  itemName?: string;
  basePrice?: number;
  productRef?: string;
  itemDetails?: {
    features?: string[];
    location?: string;
    provider?: string;
    id?: string;
    name?: string;
    checkIn?: string;
    checkOut?: string;
    rating?: number;
  };
  onBargainSuccess?: (finalPrice: number, orderRef: string) => void;
  useBargainModal?: boolean;
  userName?: string;
  isMobile?: boolean;
}

export function BargainButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  size = "md",
  // Bargain props
  module = 'hotels',
  itemName = '',
  basePrice = 0,
  productRef = '',
  itemDetails = {},
  onBargainSuccess,
  useBargainModal = false,
  userName = 'Guest',
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
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) return;

    e.preventDefault();
    e.stopPropagation();

    // Haptic feedback for mobile devices
    if (isMobileDevice()) {
      hapticFeedback("light");
    }

    // Use bargain modal if enabled and required props are provided
    if (useBargainModal && itemName && basePrice > 0) {
      setIsBargainModalOpen(true);
    } else {
      onClick?.(e);
    }
  };

  const handleBargainSuccess = (finalPrice: number, orderRef: string) => {
    setIsBargainModalOpen(false);
    onBargainSuccess?.(finalPrice, orderRef);
  };

  const handleBargainHold = (orderRef: string) => {
    setIsBargainModalOpen(false);
    // Handle hold logic if needed
    console.log('Bargain held:', orderRef);
  };

  // Use Button's built-in variant system (default already has correct blue colors)
  const mobileClasses = "flex-1 touch-manipulation active:scale-95";
  const additionalClasses = "touch-manipulation active:scale-95";

  // Determine which classes to use
  let buttonClasses = className || (isMobile ? mobileClasses : additionalClasses);

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || loading}
        size={size === "md" ? "default" : size}
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

      {/* Conversational Bargain Modal */}
      {useBargainModal && (
        <ConversationalBargainModal
          isOpen={isBargainModalOpen}
          onClose={() => setIsBargainModalOpen(false)}
          onAccept={handleBargainSuccess}
          onHold={handleBargainHold}
          module={module}
          userName={userName}
          basePrice={basePrice}
          productRef={productRef || itemName || 'product'}
          flight={module === 'flights' ? {
            id: itemDetails.id || '1',
            airline: itemDetails.provider || 'Airline',
            flightNumber: productRef || 'FL001',
            from: itemDetails.location || 'Origin',
            to: 'Destination',
            departureTime: '10:00',
            arrivalTime: '12:00',
            price: basePrice,
            duration: '2h'
          } : undefined}
          hotel={module === 'hotels' ? {
            id: itemDetails.id || '1',
            name: itemName || 'Hotel',
            location: itemDetails.location || 'City',
            checkIn: itemDetails.checkIn || '2025-01-01',
            checkOut: itemDetails.checkOut || '2025-01-02',
            price: basePrice,
            rating: itemDetails.rating || 4
          } : undefined}
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
