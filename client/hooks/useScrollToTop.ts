import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useScrollToTop = (behavior: ScrollBehavior = "auto") => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll to top when location changes (route or query params)
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior, // "auto" for instant (better for mobile), "smooth" for desktop
      });

      // Also scroll any main container to top (for pages with scroll containers)
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
    });
  }, [pathname, search, behavior]);
};
