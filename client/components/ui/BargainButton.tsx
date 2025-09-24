import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";
import ConversationalBargainModal from "@/components/ConversationalBargainModal";
import { useAuthGuard } from "@/utils/authGuards";
import type { SearchContext } from "@/utils/authGuards";

export interface BargainButtonProps {
  children?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";

  /** Use the conversational bargain modal instead of plain onClick */
  useBargainModal?: boolean;
  /** Enhanced modal variant (alias for useBargainModal) */
  useEnhancedModal?: boolean;
  module?: "flights" | "hotels" | "sightseeing" | "transfers";
  userName?: string;

  /** Context for the modal */
  itemName?: string;
  basePrice?: number;
  /** Supplier net rate (alias for basePrice) */
  supplierNetRate?: number;
  productRef?: string;
  itemDetails?: {
    id?: string;
    name?: string;
    provider?: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
    rating?: number;
  };

  onBargainSuccess?: (finalPrice: number, orderRef: string) => void;

  /** Search context for authentication guard (REQUIRED for auth) */
  searchContext?: SearchContext;

  /** Enforce authentication before allowing bargain (default: true) */
  requireAuth?: boolean;

  /** Forwarded DOM props */
  id?: string;
  "data-testid"?: string;
  "aria-label"?: string;
}

const buttonClasses = cn(
  // base / a11y
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
  // yellow theme
  "bg-[#FFC107] hover:bg-[#FFB300] text-[#1a1f2c]",
  // size
  "h-10 px-4",
);

// Make BargainButton a **named** export…
export function BargainButton({
  children = "Bargain Now",
  onClick,
  disabled = false,
  loading = false,
  className,
  size = "md",
  useBargainModal = false,
  useEnhancedModal = false,
  module = "flights",
  userName = "Guest",
  itemName = "",
  basePrice = 0,
  supplierNetRate,
  productRef = "",
  itemDetails = {},
  onBargainSuccess,
  searchContext,
  requireAuth = true,
  id,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
}: BargainButtonProps) {
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const { requireAuthForBargain, isAuthenticated } = useAuthGuard();

  // Use either useEnhancedModal or useBargainModal
  const shouldShowModal = useBargainModal || useEnhancedModal;

  // Use supplierNetRate if provided, otherwise fall back to basePrice
  const effectivePrice = supplierNetRate ?? basePrice;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) return;

    e.preventDefault();
    e.stopPropagation();

    // Check authentication if required
    if (requireAuth) {
      // Create search context if not provided
      const contextToUse = searchContext || {
        module: module as any,
        itemName,
        basePrice: effectivePrice,
        productRef,
        itemDetails
      };

      // Require authentication before proceeding
      if (!requireAuthForBargain(contextToUse)) {
        return; // User redirected to login
      }
    }

    // User is authenticated (or auth not required), proceed with bargain
    if (shouldShowModal && effectivePrice > 0) {
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
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(buttonClasses, className)}
        id={id}
        data-testid={dataTestId}
        aria-label={
          ariaLabel ||
          (typeof children === "string" ? children : "Bargain button")
        }
      >
        {!loading && <TrendingDown className="w-4 h-4" />}
        {loading && (
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
        )}
        {children}
      </Button>

      {shouldShowModal && (
        <ConversationalBargainModal
          isOpen={isBargainModalOpen}
          onClose={() => setIsBargainModalOpen(false)}
          onAccept={handleBargainSuccess}
          onHold={handleBargainHold}
          module={module}
          userName={userName}
          basePrice={effectivePrice}
          productRef={productRef || itemName || "product"}
          flight={
            module === "flights"
              ? {
                  id: itemDetails.id || "1",
                  airline: itemDetails.provider || "Airline",
                  flightNumber: productRef || "FL001",
                  from: itemDetails.location || "Origin",
                  to: "Destination",
                  departureTime: "10:00",
                  arrivalTime: "12:00",
                  price: effectivePrice,
                  duration: "2h",
                }
              : undefined
          }
          hotel={
            module === "hotels"
              ? {
                  id: itemDetails.id || "1",
                  name: itemName || "Hotel",
                  location: itemDetails.location || "City",
                  checkIn: itemDetails.checkIn || "2025-01-01",
                  checkOut: itemDetails.checkOut || "2025-01-02",
                  price: effectivePrice,
                  rating: itemDetails.rating || 4,
                }
              : undefined
          }
        />
      )}
    </>
  );
}

// …and keep the size variants as named exports too.
export function BargainButtonSmall(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="sm" {...props} />;
}
export function BargainButtonLarge(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="lg" {...props} />;
}
export function BargainButtonMobile(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="md" {...props} />;
}

// Also export it as the default so both styles work:
//   import BargainButton from "...";
//   import { BargainButton } from "..."
export default BargainButton;
