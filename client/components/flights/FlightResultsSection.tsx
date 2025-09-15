import React from "react";
import FlightCard, { FlightItem } from "./FlightCard";
import FlightFilters, { Filters } from "./FlightFilters";

export type FlightResultsSectionProps = {
  flights: FlightItem[];
  filters?: Filters;
  onChangeFilters?: (f: Filters) => void;
  onViewDetails?: (flight: FlightItem) => void;
  onBargainSuccess?: (finalPrice: number, orderRef: string, flight: FlightItem) => void;
  title?: string;
};

export default function FlightResultsSection({
  flights,
  filters = { stops: "any", airlines: [] },
  onChangeFilters,
  onViewDetails,
  onBargainSuccess,
  title = "Flight Results",
}: FlightResultsSectionProps) {
  return (
    <section className="container mx-auto max-w-6xl px-3 md:px-6">
      <h2 className="sr-only">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-6">
        <FlightFilters value={filters} onChange={onChangeFilters || (() => {})} />
        <div className="space-y-4">
          {flights.map((f) => (
            <FlightCard
              key={f.id}
              flight={f}
              onViewDetails={onViewDetails}
              onBargainSuccess={onBargainSuccess}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
