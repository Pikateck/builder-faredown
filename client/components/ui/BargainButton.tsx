import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";
import ConversationalBargainModal from "@/components/ConversationalBargainModal";

export interface BargainButtonProps {
  children?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  useBargainModal?: boolean;
  module?: "flights" | "hotels" | "sightseeing" | "transfers";
  userName?: string;
  itemName?: string;
  basePrice?: number;
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
  id?: string;
  "data-testid"?: string;
  "aria-label"?: string;
  [key: string]: any;
}

const buttonClasses = cn(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
  "bg-[#FFC107] hover:bg-[#FFB300] text-[#1a1f2c]",
  "h-10 px-4"
);

export default function BargainButton({
  children = "Bargain Now",
  onClick,
  disabled = false,
  loading = false,
  className,
  size = "md",
  useBargainModal = false,
  module = "flights",
  userName = "Guest",
  itemName = "",
  basePrice = 0,
  productRef = "",
  itemDetails = {},
  onBargainSuccess,
  id,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
  ...domProps
}: BargainButtonProps) {
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) return;
    if (useBargainModal && basePrice > 0) {
      e.preventDefault();
      e.stopPropagation();
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
        aria-label={ariaLabel || (typeof children === "string" ? children : "Bargain button")}
        {...domProps}
      >
        {!loading && <TrendingDown className="w-4 h-4" />}
        {loading && (
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
        )}
        {children}
      </Button>

      {useBargainModal && (
        <ConversationalBargainModal
          isOpen={isBargainModalOpen}
          onClose={() => setIsBargainModalOpen(false)}
          onAccept={handleBargainSuccess}
          onHold={handleBargainHold}
          module={module}
          userName={userName}
          basePrice={basePrice}
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
                  price: basePrice,
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
                  price: basePrice,
                  rating: itemDetails.rating || 4,
                }
              : undefined
          }
        />
      )}
    </>
  );
}

export function BargainButtonSmall(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="sm" {...props} />;
}
export function BargainButtonLarge(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="lg" {...props} />;
}
export function BargainButtonMobile(props: Omit<BargainButtonProps, "size">) {
  return <BargainButton size="md" {...props} />;
}
