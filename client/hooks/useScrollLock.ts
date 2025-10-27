import { useEffect } from "react";

let lockY = 0;

/**
 * Lock body scroll by setting overflow: hidden
 * Compensates for scrollbar width to avoid layout shift
 */
export function lockBodyScroll() {
  lockY = window.scrollY || document.documentElement.scrollTop || 0;
  const { body } = document;
  
  // Store previous state
  body.dataset.prevOverflow = body.style.overflow || "";
  body.dataset.prevPaddingRight = body.style.paddingRight || "";
  
  // Calculate scrollbar width
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  
  // Lock body
  body.style.overflow = "hidden";
  
  // Avoid layout shift when scrollbar disappears
  if (scrollBarWidth > 0) {
    body.style.paddingRight = `${scrollBarWidth}px`;
  }
}

/**
 * Unlock body scroll and restore previous state
 * Restores the exact scroll position
 */
export function unlockBodyScroll() {
  const { body } = document;
  const prevOverflow = body.dataset.prevOverflow || "";
  const prevPaddingRight = body.dataset.prevPaddingRight || "";
  
  body.style.overflow = prevOverflow;
  body.style.paddingRight = prevPaddingRight;
  
  delete body.dataset.prevOverflow;
  delete body.dataset.prevPaddingRight;
  
  // Use requestAnimationFrame to ensure styles are applied before scrolling
  requestAnimationFrame(() => {
    window.scrollTo({ top: lockY, behavior: "instant" });
    lockY = 0;
  });
}

/**
 * Hook to manage scroll locking when a modal/sheet is open
 * @param isOpen - Whether the modal is currently open
 */
export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
      return () => {
        unlockBodyScroll();
      };
    } else {
      unlockBodyScroll();
    }
  }, [isOpen]);
}
