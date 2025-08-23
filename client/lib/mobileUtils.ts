// Mobile responsiveness utilities

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < breakpoints.md;
};

export const isTablet = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg
  );
};

export const isDesktop = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= breakpoints.lg;
};

export const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  if (isMobile()) return "mobile";
  if (isTablet()) return "tablet";
  return "desktop";
};

// Responsive grid configurations
export const getGridCols = (
  items: number,
  options?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  },
): string => {
  const mobile = options?.mobile || 1;
  const tablet = options?.tablet || 2;
  const desktop = options?.desktop || Math.min(items, 3);

  return `grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`;
};

// Responsive spacing
export const getResponsiveSpacing = (
  size: "xs" | "sm" | "md" | "lg" | "xl",
): string => {
  const spacings = {
    xs: "p-2 sm:p-3",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
    xl: "p-8 sm:p-12",
  };
  return spacings[size];
};

// Responsive text sizes
export const getResponsiveText = (
  size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl",
): string => {
  const sizes = {
    xs: "text-xs",
    sm: "text-xs sm:text-sm",
    base: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
    xl: "text-lg sm:text-xl",
    "2xl": "text-xl sm:text-2xl",
    "3xl": "text-2xl sm:text-3xl",
  };
  return sizes[size];
};

// Responsive gap
export const getResponsiveGap = (size: "sm" | "md" | "lg"): string => {
  const gaps = {
    sm: "gap-2 sm:gap-3",
    md: "gap-3 sm:gap-4 lg:gap-6",
    lg: "gap-4 sm:gap-6 lg:gap-8",
  };
  return gaps[size];
};

// Touch-friendly button sizing
export const getTouchFriendlySize = (): string => {
  return "min-h-[44px] min-w-[44px] touch-manipulation";
};

// Mobile-first container
export const getResponsiveContainer = (): string => {
  return "w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8";
};

// Responsive flex direction
export const getResponsiveFlex = (direction: "col" | "row" = "col"): string => {
  return direction === "col" ? "flex flex-col md:flex-row" : "flex flex-row";
};

// Hide/show on different screen sizes
export const hideOnMobile = "hidden md:block";
export const hideOnDesktop = "block md:hidden";
export const showOnMobileOnly = "block sm:hidden";
export const showOnTabletUp = "hidden sm:block";

// Additional mobile optimization utilities for bargain feature

export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
};

export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportHeight = (): number => {
  if (typeof window === "undefined") return 0;
  return window.innerHeight || document.documentElement.clientHeight;
};

export const preventZoomOnInput = (element: HTMLInputElement): void => {
  if (!element) return;

  // Set font-size to 16px to prevent iOS zoom
  element.style.fontSize = '16px';

  // Add attributes to prevent autocorrect/autocomplete
  element.setAttribute('autocomplete', 'off');
  element.setAttribute('autocorrect', 'off');
  element.setAttribute('autocapitalize', 'none');
  element.setAttribute('spellcheck', 'false');
};

export const addMobileTouchOptimizations = (element: HTMLElement): void => {
  if (!element) return;

  // Add touch optimization styles
  element.style.touchAction = 'manipulation';
  element.style.webkitTouchCallout = 'none';
  element.style.webkitUserSelect = 'none';
  element.style.webkitTapHighlightColor = 'transparent';

  // Add minimum touch target size
  if (element.offsetHeight < 44) {
    element.style.minHeight = '44px';
  }
  if (element.offsetWidth < 44) {
    element.style.minWidth = '44px';
  }
};

export const getMobileKeyboardHeight = (): number => {
  if (typeof window === "undefined") return 0;

  // Estimate keyboard height based on viewport change
  const initialHeight = window.innerHeight;
  const currentHeight = window.visualViewport?.height || window.innerHeight;

  return Math.max(0, initialHeight - currentHeight);
};

export const addMobileScrollOptimizations = (element: HTMLElement): void => {
  if (!element) return;

  element.style.webkitOverflowScrolling = 'touch';
  element.style.scrollBehavior = 'smooth';
  element.style.overscrollBehavior = 'contain';
};

export const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const hapticFeedback = (type: "light" | "medium" | "heavy"): void => {
  // iOS haptic feedback
  if (isIOS() && 'Haptics' in window) {
    try {
      switch (type) {
        case 'light':
          // @ts-ignore - iOS specific API
          window.Haptics.impactOccurred({ intensity: 'light' });
          break;
        case 'medium':
          // @ts-ignore - iOS specific API
          window.Haptics.impactOccurred({ intensity: 'medium' });
          break;
        case 'heavy':
          // @ts-ignore - iOS specific API
          window.Haptics.impactOccurred({ intensity: 'heavy' });
          break;
      }
    } catch (e) {
      // Fallback to vibration
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      vibrate(patterns[type]);
    }
  } else {
    // Android vibration fallback
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    vibrate(patterns[type]);
  }
};

export default {
  breakpoints,
  isMobile,
  isTablet,
  isDesktop,
  getDeviceType,
  getGridCols,
  getResponsiveSpacing,
  getResponsiveText,
  getResponsiveGap,
  getTouchFriendlySize,
  getResponsiveContainer,
  getResponsiveFlex,
  hideOnMobile,
  hideOnDesktop,
  showOnMobileOnly,
  showOnTabletUp,
  // New mobile optimization functions
  isMobileDevice,
  isIOS,
  isAndroid,
  isTouchDevice,
  getViewportHeight,
  preventZoomOnInput,
  addMobileTouchOptimizations,
  getMobileKeyboardHeight,
  addMobileScrollOptimizations,
  vibrate,
  hapticFeedback,
};
