import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for debouncing values to prevent excessive API calls
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing callbacks (API calls, searches, etc.)
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for debounced API calls with loading state and error handling
 */
export function useDebouncedApiCall<T, P extends any[]>(
  apiCall: (...args: P) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    (...args: P) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setError(null);

      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        abortControllerRef.current = new AbortController();

        try {
          const result = await apiCall(...args);
          if (!abortControllerRef.current.signal.aborted) {
            setData(result);
            setError(null);
          }
        } catch (err) {
          if (!abortControllerRef.current.signal.aborted) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setData(null);
          }
        } finally {
          if (!abortControllerRef.current.signal.aborted) {
            setLoading(false);
          }
        }
      }, delay);
    },
    [apiCall, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { data, loading, error, execute };
}

/**
 * Hook for throttling rapid function calls (for scroll events, resize, etc.)
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}
