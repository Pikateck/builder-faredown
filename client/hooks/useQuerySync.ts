import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { qp, getLastSearch, saveLastSearch, Dict } from "@/lib/searchParams";

// Keeps component state, URL query, and sessionStorage aligned.
export function useQuerySync(initial: Dict, opts?: { replace?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  const fromQuery = useMemo(() => {
    const q = qp.parse(location.search);
    if (Object.keys(q).length) return q;
    return getLastSearch() ?? {};
  }, [location.search]);

  // Merge precedence: query > initial
  const merged = { ...initial, ...fromQuery };

  function update(next: Dict) {
    const qs = qp.stringify(next);
    const url = `${location.pathname}?${qs}`;
    if (opts?.replace) navigate(url, { replace: true });
    else navigate(url);
    saveLastSearch(next);
  }

  // Prime sessionStorage on first mount if URL already has data
  useEffect(() => {
    if (Object.keys(fromQuery).length) saveLastSearch(fromQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { params: merged, setParams: update };
}
