import React from "react";
import { qp, norm, Dict } from "@/lib/searchParams";
import { useNavigate } from "react-router-dom";
import { useQuerySync } from "@/hooks/useQuerySync";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Module = "flights" | "hotels" | "sightseeing" | "transfers";

type Props =
  | { module: "flights" }
  | { module: "hotels" }
  | { module: "sightseeing" }
  | { module: "transfers" };

export default function SearchBar(props: Props) {
  const navigate = useNavigate();

  // Minimal initial shapes per module
  const initial: Dict =
    props.module === "flights"
      ? { from: "", to: "", depart: "", return: "", adults: "1", children: "0", infants: "0", class: "ECONOMY" }
      : props.module === "hotels"
      ? { city: "", checkin: "", checkout: "", rooms: "1", adults: "2", children: "0" }
      : props.module === "sightseeing"
      ? { city: "", date: "", adults: "2", children: "0" }
      : { fromLat: "", fromLng: "", toLat: "", toLng: "", date: "", adults: "2", bags: "0" };

  const { params, setParams } = useQuerySync(initial, { replace: true });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setParams({ ...params, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = { ...params };

    // light normalization
    if ("depart" in p) p.depart = norm.iso(p.depart || "");
    if ("return" in p) p.return = norm.iso(p.return || "");
    if ("checkin" in p) p.checkin = norm.iso(p.checkin || "");
    if ("checkout" in p) p.checkout = norm.iso(p.checkout || "");
    if ("date" in p) p.date = norm.iso(p.date || "");
    ["adults", "children", "infants", "rooms", "bags"].forEach(k => {
      if (k in p) p[k] = norm.int(p[k]);
    });

    const qs = qp.stringify(p);
    const base =
      props.module === "flights"
        ? "/flights/results"
        : props.module === "hotels"
        ? "/hotels/results"
        : props.module === "sightseeing"
        ? "/sightseeing/results"
        : "/transfers/results";

    navigate(`${base}?${qs}`);
  }

  // Render field sets using project's design system
  return (
    <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 md:grid-cols-6 gap-3">
      {props.module === "flights" && (
        <>
          <Input
            className="md:col-span-1"
            name="from"
            placeholder="From (IATA)"
            value={params.from || ""}
            onChange={handleChange}
          />
          <Input
            className="md:col-span-1"
            name="to"
            placeholder="To (IATA)"
            value={params.to || ""}
            onChange={handleChange}
          />
          <Input
            className="md:col-span-1"
            type="date"
            name="depart"
            value={params.depart || ""}
            onChange={handleChange}
          />
          <Input
            className="md:col-span-1"
            type="date"
            name="return"
            value={params.return || ""}
            onChange={handleChange}
          />
          <select
            className={cn(
              "flex h-10 w-full rounded-md border-2 border-[#003580] bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
            name="class"
            value={params.class || "ECONOMY"}
            onChange={handleChange}
          >
            <option>ECONOMY</option>
            <option>PREMIUM</option>
            <option>BUSINESS</option>
            <option>FIRST</option>
          </select>
          <Input
            name="adults"
            type="number"
            min={1}
            placeholder="Adults"
            value={params.adults || "1"}
            onChange={handleChange}
          />
        </>
      )}

      {props.module === "hotels" && (
        <>
          <Input
            className="md:col-span-2"
            name="city"
            placeholder="City"
            value={params.city || ""}
            onChange={handleChange}
          />
          <Input
            type="date"
            name="checkin"
            value={params.checkin || ""}
            onChange={handleChange}
          />
          <Input
            type="date"
            name="checkout"
            value={params.checkout || ""}
            onChange={handleChange}
          />
          <Input
            name="rooms"
            type="number"
            min={1}
            placeholder="Rooms"
            value={params.rooms || "1"}
            onChange={handleChange}
          />
          <Input
            name="adults"
            type="number"
            min={1}
            placeholder="Adults"
            value={params.adults || "2"}
            onChange={handleChange}
          />
        </>
      )}

      {props.module === "sightseeing" && (
        <>
          <Input
            className="md:col-span-2"
            name="city"
            placeholder="City"
            value={params.city || ""}
            onChange={handleChange}
          />
          <Input
            className="md:col-span-2"
            type="date"
            name="date"
            value={params.date || ""}
            onChange={handleChange}
          />
          <Input
            name="adults"
            type="number"
            min={1}
            placeholder="Adults"
            value={params.adults || "2"}
            onChange={handleChange}
          />
          <Input
            name="children"
            type="number"
            min={0}
            placeholder="Children"
            value={params.children || "0"}
            onChange={handleChange}
          />
        </>
      )}

      {props.module === "transfers" && (
        <>
          <Input
            name="fromLat"
            placeholder="From Lat"
            value={params.fromLat || ""}
            onChange={handleChange}
          />
          <Input
            name="fromLng"
            placeholder="From Lng"
            value={params.fromLng || ""}
            onChange={handleChange}
          />
          <Input
            name="toLat"
            placeholder="To Lat"
            value={params.toLat || ""}
            onChange={handleChange}
          />
          <Input
            name="toLng"
            placeholder="To Lng"
            value={params.toLng || ""}
            onChange={handleChange}
          />
          <Input
            type="date"
            name="date"
            value={params.date || ""}
            onChange={handleChange}
          />
          <Input
            name="adults"
            type="number"
            min={1}
            placeholder="Adults"
            value={params.adults || "2"}
            onChange={handleChange}
          />
        </>
      )}

      <Button className="md:col-span-1" type="submit">
        Search
      </Button>
    </form>
  );
}
