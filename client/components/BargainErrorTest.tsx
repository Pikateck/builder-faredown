/**
 * Test component to verify bargain error handling
 * Tests the ConversationalBargainModal graceful fallback when API is offline
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConversationalBargainModal } from "./ConversationalBargainModal";

export default function BargainErrorTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testFlight = {
    id: "test_flight_1",
    airline: "Test Airlines",
    flightNumber: "TA123",
    from: "DEL",
    to: "BOM",
    departureTime: "10:30",
    arrivalTime: "12:45",
    price: 5000,
    duration: "2h 15m",
  };

  const handleAccept = (
    finalPrice: number,
    orderRef: string,
    holdData?: any,
  ) => {
    console.log("✅ Bargain accepted:", { finalPrice, orderRef, holdData });
    alert(
      `Bargain accepted! Final price: ₹${finalPrice}\nOrder Ref: ${orderRef}\nHold Status: ${holdData?.isHeld ? "Held" : "Not held"}`,
    );
    setIsModalOpen(false);
  };

  const handleHold = (orderRef: string) => {
    console.log("📌 Hold created:", orderRef);
  };

  return (
    <div className="p-4 border rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-2">Bargain Error Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Test the ConversationalBargainModal to verify it handles API errors
        gracefully. This should work even when the backend is offline.
      </p>

      <Button onClick={() => setIsModalOpen(true)}>
        Test Bargain Modal (API Offline Scenario)
      </Button>

      <ConversationalBargainModal
        isOpen={isModalOpen}
        flight={testFlight}
        onClose={() => setIsModalOpen(false)}
        onAccept={handleAccept}
        onHold={handleHold}
        userName="Test User"
        module="flights"
        basePrice={5000}
        productRef="test_flight_1"
      />
    </div>
  );
}
