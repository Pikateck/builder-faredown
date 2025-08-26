import React, { useState } from "react";
import { ChevronLeft, Car, Plane, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileFullScreenTransferTypeInputProps {
  title: string;
  initialTransferType: "airport-taxi" | "car-rentals";
  initialTripType: "one-way" | "return";
  onSelect: (
    transferType: "airport-taxi" | "car-rentals",
    tripType: "one-way" | "return",
  ) => void;
  onBack: () => void;
}

export function MobileFullScreenTransferTypeInput({
  title,
  initialTransferType,
  initialTripType,
  onSelect,
  onBack,
}: MobileFullScreenTransferTypeInputProps) {
  const [transferType, setTransferType] = useState<
    "airport-taxi" | "car-rentals"
  >(initialTransferType);
  const [tripType, setTripType] = useState<"one-way" | "return">(
    initialTripType,
  );

  const handleConfirm = () => {
    onSelect(transferType, tripType);
    onBack();
  };

  const transferOptions = [
    {
      id: "airport-taxi" as const,
      title: "Airport Taxi",
      description: "Direct transfers to and from airports",
      icon: Plane,
      features: ["Professional drivers", "Flight tracking", "Meet & greet"],
    },
    {
      id: "car-rentals" as const,
      title: "Car Rentals",
      description: "Self-drive rental cars",
      icon: Car,
      features: ["Flexible pickup", "Various car types", "Long-term options"],
    },
  ];

  const tripOptions = [
    {
      id: "one-way" as const,
      title: "One-way",
      description: "Single journey",
    },
    {
      id: "return" as const,
      title: "Return",
      description: "Round trip with return journey",
    },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Native App Header */}
      <div className="bg-[#003580] text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Current Selection Summary */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">Selected transfer</div>
            <div className="font-semibold text-gray-900 text-base">
              {transferType === "airport-taxi" ? "Airport Taxi" : "Car Rentals"}{" "}
              • {tripType === "one-way" ? "One-way" : "Return"}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Transfer Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Transfer Type
          </h2>
          <div className="space-y-3">
            {transferOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setTransferType(option.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    transferType === option.id
                      ? "border-[#003580] bg-blue-50"
                      : "border-gray-200 hover:border-[#003580] hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        transferType === option.id
                          ? "bg-[#003580] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {option.title}
                        </h3>
                        {transferType === option.id && (
                          <Check className="w-5 h-5 text-[#003580]" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {option.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {option.features.map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trip Type Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Trip Type
          </h2>
          <div className="space-y-3">
            {tripOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTripType(option.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  tripType === option.id
                    ? "border-[#003580] bg-blue-50"
                    : "border-gray-200 hover:border-[#003580] hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {option.title}
                      </h3>
                      {tripType === option.id && (
                        <Check className="w-5 h-5 text-[#003580]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 ${
                      tripType === option.id
                        ? "bg-[#003580] border-[#003580]"
                        : "border-gray-300"
                    }`}
                  >
                    {tripType === option.id && (
                      <Check className="w-4 h-4 text-white m-0.5" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
        <Button
          onClick={handleConfirm}
          className="w-full bg-[#003580] hover:bg-[#002660] text-white py-3 rounded-xl font-medium text-base flex items-center justify-center space-x-2"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Selection</span>
        </Button>
      </div>
    </div>
  );
}
