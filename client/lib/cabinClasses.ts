export type CabinClassValue = "economy" | "premium-economy" | "business" | "first";

type CabinClassAliasMap = Record<string, CabinClassValue>;

const CABIN_CLASS_ALIASES: CabinClassAliasMap = {
  economy: "economy",
  eco: "economy",
  y: "economy",
  "y+": "economy",
  coach: "economy",
  standard: "economy",
  "premium-economy": "premium-economy",
  "premium economy": "premium-economy",
  premiumeconomy: "premium-economy",
  premium: "premium-economy",
  "premium_economy": "premium-economy",
  pe: "premium-economy",
  w: "premium-economy",
  business: "business",
  biz: "business",
  j: "business",
  "j+": "business",
  corporate: "business",
  first: "first",
  f: "first",
  suite: "first",
};

export const CABIN_CLASS_LABELS: Record<CabinClassValue, string> = {
  economy: "All – Economy Class",
  "premium-economy": "All – Premium Economy Class",
  business: "All – Business Class",
  first: "All – First Class",
};

export const CABIN_CLASS_OPTIONS: Array<{ value: CabinClassValue; label: string }> = (
  Object.entries(CABIN_CLASS_LABELS) as Array<[CabinClassValue, string]>
).map(([value, label]) => ({ value, label }));

export const CABIN_CLASS_FILTER_OPTIONS: Array<{
  value: "" | CabinClassValue;
  label: string;
}> = [{ value: "", label: "All Cabin Classes" }, ...CABIN_CLASS_OPTIONS];

/**
 * Normalize any cabin class input from UI, API, or supplier data to the canonical values
 * used across the admin interfaces.
 */
export const normalizeCabinClass = (
  input?: string | null,
): CabinClassValue | null => {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedKey = trimmed.toLowerCase();
  if (normalizedKey in CABIN_CLASS_ALIASES) {
    return CABIN_CLASS_ALIASES[normalizedKey];
  }

  // Handle single-letter supplier codes (Y, J, F, W)
  const upper = trimmed.toUpperCase();
  if (upper in CABIN_CLASS_ALIASES) {
    return CABIN_CLASS_ALIASES[upper.toLowerCase()];
  }

  // Fallback: attempt to match by removing non-alphabetic characters
  const sanitized = normalizedKey.replace(/[^a-z]/g, "");
  if (sanitized in CABIN_CLASS_ALIASES) {
    return CABIN_CLASS_ALIASES[sanitized];
  }

  return null;
};

export const getCabinClassLabel = (input?: string | null): string => {
  const normalized = normalizeCabinClass(input);
  if (!normalized) {
    return input ?? "";
  }
  return CABIN_CLASS_LABELS[normalized];
};
