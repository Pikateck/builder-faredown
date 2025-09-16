// Normalized helpers for all modules
export type Dict = Record<string, string>;

export const qp = {
  parse(search: string): Dict {
    const out: Dict = {};
    const u = new URLSearchParams(search);
    u.forEach((v, k) => (out[k] = v));
    return out;
  },
  stringify(params: Dict): string {
    const u = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length) u.set(k, String(v));
    });
    return u.toString();
  },
};

const KEY = "fd:lastSearch";

export function saveLastSearch(data: Dict) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function getLastSearch(): Dict | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Light normalizers (extend as needed)
export const norm = {
  iso(d: string) {
    // expects YYYY-MM-DD; no mutation if already ISO
    return d?.slice(0, 10);
  },
  int(n: string | number) {
    const v = parseInt(String(n || "0"), 10);
    return isFinite(v) ? String(v) : "0";
  },
};
