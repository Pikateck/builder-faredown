import { useEffect, useState } from "react";

// Suppress ResizeObserver loop errors (they're benign)
if (typeof window !== "undefined") {
  const resizeObserverErr = window.console.error;
  window.console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("ResizeObserver loop")
    ) {
      return;
    }
    resizeObserverErr(...args);
  };
}

const getActualViewportWidth = (): number => {
  if (typeof window === "undefined") {
    return 1024;
  }

  try {
    if (window.parent !== window && window.frameElement) {
      const frameWidth = window.frameElement?.getBoundingClientRect?.()?.width;
      if (frameWidth && frameWidth > 0) {
        return frameWidth;
      }
    }
  } catch (e) {
    // Cross-origin iframe
  }

  return (
    window.innerWidth ||
    document.documentElement?.clientWidth ||
    document.body?.clientWidth ||
    1024
  );
};

export function useViewportClass() {
  const [isMobile, setIsMobile] = useState(
    () => getActualViewportWidth() < 768
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const updateViewportClass = () => {
      const width = getActualViewportWidth();
      const nowMobile = width < 768;
      setIsMobile(nowMobile);

      const root = document.documentElement;
      if (nowMobile) {
        root.classList.add("viewport-mobile");
        root.classList.remove("viewport-desktop");
        console.log(`[Viewport] Mobile detected (width: ${width}px)`);
      } else {
        root.classList.add("viewport-desktop");
        root.classList.remove("viewport-mobile");
        console.log(`[Viewport] Desktop detected (width: ${width}px)`);
      }
    };

    const disposers: Array<() => void> = [];

    updateViewportClass();

    const isInIframe = window.parent !== window;
    if (isInIframe) {
      const intervalId = setInterval(updateViewportClass, 100);
      disposers.push(() => clearInterval(intervalId));
    }

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => {
        updateViewportClass();
      });
      const rootElement = document.documentElement;
      if (rootElement) {
        observer.observe(rootElement);
        disposers.push(() => observer.disconnect());
      }
    } else {
      const handleResize = () => updateViewportClass();
      window.addEventListener("resize", handleResize);
      disposers.push(() => window.removeEventListener("resize", handleResize));
    }

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, []);

  return isMobile;
}
