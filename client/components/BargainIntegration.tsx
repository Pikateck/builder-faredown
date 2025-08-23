import React, { useState } from "react";
import BargainButton from "@/components/ui/BargainButton";
import ConversationalBargainModal from "@/components/ConversationalBargainModal";
import { TrendingDown } from "lucide-react";

// Import CSS files for mobile optimizations and button styling
import "@/styles/mobile-bargain-optimizations.css";
import "@/styles/bargain-button.css";

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  duration: string;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  price: number;
  rating: number;
}

interface FareType {
  type: string;
  price: number;
  features: string[];
}

interface BargainIntegrationProps {
  // Item data
  flight?: Flight;
  hotel?: Hotel;
  sightseeing?: any;
  transfer?: any;

  // Module type
  module: "flights" | "hotels" | "sightseeing" | "transfers";

  // Price and product reference
  basePrice: number;
  productRef: string;
  selectedFareType?: FareType;

  // User context
  userName?: string;

  // Callbacks
  onAccept?: (finalPrice: number, orderRef: string) => void;
  onHold?: (orderRef: string) => void;
  onBackToResults?: () => void;

  // UI customization
  buttonText?: string;
  buttonSize?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function BargainIntegration({
  flight,
  hotel,
  sightseeing,
  transfer,
  module,
  basePrice,
  productRef,
  selectedFareType,
  userName = "Guest",
  onAccept,
  onHold,
  onBackToResults,
  buttonText = "Bargain Now",
  buttonSize = "md",
  showIcon = true,
  className = "",
}: BargainIntegrationProps) {
  const [showBargainModal, setShowBargainModal] = useState(false);

  // Safety checks for required props
  if (!basePrice || !productRef) {
    console.error(
      "BargainIntegration: Missing required props - basePrice and productRef are required",
    );
    return null;
  }

  if (module === "flights" && !flight) {
    console.error(
      "BargainIntegration: Flight data required for flights module",
    );
    return null;
  }

  const handleAccept = (finalPrice: number, orderRef: string) => {
    console.log(`✅ Bargain accepted: ${finalPrice} (Order: ${orderRef})`);
    setShowBargainModal(false);

    // Navigate to booking flow with negotiated price
    if (onAccept) {
      onAccept(finalPrice, orderRef);
    } else {
      // Default navigation based on module
      const baseParams = new URLSearchParams({
        price: finalPrice.toString(),
        orderRef,
        bargainApplied: "true",
      });

      switch (module) {
        case "flights":
          window.location.href = `/booking?flight=${productRef}&${baseParams.toString()}`;
          break;
        case "hotels":
          window.location.href = `/hotels/booking?hotel=${productRef}&${baseParams.toString()}`;
          break;
        case "sightseeing":
          window.location.href = `/sightseeing/booking?activity=${productRef}&${baseParams.toString()}`;
          break;
        case "transfers":
          window.location.href = `/transfer-booking?transfer=${productRef}&${baseParams.toString()}`;
          break;
      }
    }
  };

  const handleHold = (orderRef: string) => {
    console.log(`⏱️ Price hold created: ${orderRef}`);
    if (onHold) {
      onHold(orderRef);
    }
  };

  const handleBargainClick = () => {
    console.log(`🚀 Starting bargain for ${module}:`, {
      productRef,
      basePrice,
      module,
    });
    setShowBargainModal(true);
  };

  const handleClose = () => {
    setShowBargainModal(false);
    if (onBackToResults) {
      onBackToResults();
    }
  };

  return (
    <>
      {/* Bargain Button */}
      <BargainButton
        size={buttonSize}
        onClick={handleBargainClick}
        className={className}
        icon={showIcon}
      >
        {showIcon && <TrendingDown className="w-4 h-4" />}
        {buttonText}
      </BargainButton>

      {/* Conversational Bargain Modal */}
      <ConversationalBargainModal
        isOpen={showBargainModal}
        flight={flight}
        hotel={hotel}
        selectedFareType={selectedFareType}
        onClose={handleClose}
        onAccept={handleAccept}
        onHold={handleHold}
        userName={userName}
        module={module}
        onBackToResults={handleClose}
        basePrice={basePrice}
        productRef={productRef}
      />
    </>
  );
}

// Convenience components for specific modules

export function FlightBargainButton(
  props: Omit<BargainIntegrationProps, "module">,
) {
  const {
    className,
    buttonSize = "lg",
    basePrice,
    productRef,
    flight,
    ...restProps
  } = props;

  // Safety checks
  if (!basePrice || !productRef || !flight) {
    console.error("FlightBargainButton: Missing required props", {
      basePrice,
      productRef,
      flight,
    });
    return (
      <button
        className={
          className ||
          "flex-1 py-4 bg-gray-300 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] rounded-xl cursor-not-allowed"
        }
        disabled
      >
        Bargain Unavailable
      </button>
    );
  }

  return (
    <BargainIntegration
      {...restProps}
      flight={flight}
      basePrice={basePrice}
      productRef={productRef}
      module="flights"
      className={
        className ||
        "flex-1 py-4 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200"
      }
      buttonSize={buttonSize}
    />
  );
}

export function HotelBargainButton(
  props: Omit<BargainIntegrationProps, "module">,
) {
  return <BargainIntegration {...props} module="hotels" />;
}

export function SightseeingBargainButton(
  props: Omit<BargainIntegrationProps, "module">,
) {
  return <BargainIntegration {...props} module="sightseeing" />;
}

export function TransferBargainButton(
  props: Omit<BargainIntegrationProps, "module">,
) {
  return <BargainIntegration {...props} module="transfers" />;
}

// Hook for easier integration
export function useBargainIntegration(
  module: BargainIntegrationProps["module"],
) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const openBargain = (item: any, basePrice: number, productRef: string) => {
    setCurrentItem({ item, basePrice, productRef });
    setIsOpen(true);
  };

  const closeBargain = () => {
    setIsOpen(false);
    setCurrentItem(null);
  };

  return {
    isOpen,
    currentItem,
    openBargain,
    closeBargain,
    BargainModal: ({
      onAccept,
      onHold,
      userName,
    }: {
      onAccept?: (finalPrice: number, orderRef: string) => void;
      onHold?: (orderRef: string) => void;
      userName?: string;
    }) =>
      currentItem ? (
        <ConversationalBargainModal
          isOpen={isOpen}
          flight={module === "flights" ? currentItem.item : undefined}
          hotel={module === "hotels" ? currentItem.item : undefined}
          onClose={closeBargain}
          onAccept={onAccept || (() => {})}
          onHold={onHold || (() => {})}
          userName={userName}
          module={module}
          basePrice={currentItem.basePrice}
          productRef={currentItem.productRef}
        />
      ) : null,
  };
}

export default BargainIntegration;
