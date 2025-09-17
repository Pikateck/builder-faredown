import React from "react";
import { OptimizedImage as Image } from "@/components/ui/OptimizedImage";
import BargainButton from "@/components/ui/BargainButton";

export type FareType = {
  name: string;
  price: number;
  features?: string[];
};

export type FlightItem = {
  id: string | number;
  airline: string;
  logo?: string;
  from: string;
  to: string;
  departTime: string; // "08:15"
  arriveTime: string; // "12:30"
  duration: string; // "4h 15m"
  stops?: string; // "1 Stop" | "Direct"
  price: number; // all-inclusive
  fareTypes?: FareType[];
};

export type FlightCardProps = {
  flight: FlightItem;
  // wired by Builder or page
  onViewDetails?: (flight: FlightItem) => void;
  onBargainSuccess?: (
    finalPrice: number,
    orderRef: string,
    flight: FlightItem,
  ) => void;
  variant?: "default" | "compact";
};

export default function FlightCard({
  flight,
  onViewDetails,
  onBargainSuccess,
  variant = "default",
}: FlightCardProps) {
  const {
    airline,
    logo,
    from,
    to,
    departTime,
    arriveTime,
    duration,
    stops,
    price,
    fareTypes,
  } = flight;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
      <div className="flex items-center gap-3">
        {logo ? (
          <Image
            src={logo}
            alt={airline}
            width={40}
            height={40}
            className="rounded-md"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-slate-100" />
        )}
        <div className="font-medium">{airline}</div>
        {stops && (
          <div className="ml-auto text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">
            {stops}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 items-end gap-3 md:gap-4">
        <div>
          <div className="text-xl md:text-2xl font-semibold">{departTime}</div>
          <div className="text-xs text-slate-500">{from}</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-slate-600">{duration}</div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="text-xs text-slate-500">{stops || "Direct"}</div>
        </div>

        <div className="text-right">
          <div className="text-xl md:text-2xl font-semibold">{arriveTime}</div>
          <div className="text-xs text-slate-500">{to}</div>
        </div>
      </div>

      {/* fare + actions */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">All-inclusive price</div>
          <div className="text-2xl font-semibold">
            ₹{price.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="flex gap-2">
          <BargainButton
            useBargainModal
            module="flights"
            userName="Guest"
            itemName={`${airline} ${from}–${to}`}
            basePrice={price}
            productRef={`flight-${flight.id}`}
            itemDetails={{
              id: String(flight.id),
              provider: airline,
              location: from,
            }}
            onBargainSuccess={(p, ref) => onBargainSuccess?.(p, ref, flight)}
            className="min-w-[120px]"
          >
            Bargain Now
          </BargainButton>

          <button
            className="h-10 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={() => onViewDetails?.(flight)}
          >
            View details
          </button>
        </div>
      </div>

      {variant !== "compact" && fareTypes?.length ? (
        <div className="mt-3 text-xs text-slate-600">
          <div className="font-medium mb-1">
            Flexible ticket upgrade available
          </div>
          <ul className="list-disc ml-5 space-y-0.5">
            {fareTypes.slice(0, 3).map((f, i) => (
              <li key={i}>
                {f.name} — ₹{(f.price || 0).toLocaleString("en-IN")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
