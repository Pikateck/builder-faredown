import { Builder } from "@builder.io/react";
import FlightCard from "@/components/flights/FlightCard";
import FlightResultsSection from "@/components/flights/FlightResultsSection";
import FlightFilters from "@/components/flights/FlightFilters";

Builder.registerComponent(FlightCard, {
  name: "FlightCard",
  inputs: [
    { name: "flight", type: "object", required: true, helperText: "FlightItem object" },
    { name: "variant", type: "string", enum: ["default", "compact"] },
  ],
});

Builder.registerComponent(FlightResultsSection, {
  name: "FlightResultsSection",
  inputs: [
    { name: "flights", type: "list", subFields: [{ name: "item", type: "object" }] },
    { name: "title", type: "string" },
  ],
});

Builder.registerComponent(FlightFilters, {
  name: "FlightFilters",
  inputs: [{ name: "value", type: "object" }],
});
