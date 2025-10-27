import { useEffect } from "react";

let lockY = 0;

/**
 * Lock the page scroll position
 * Stores current scroll position and fixes the document
 */
export function lockPageScroll() {
  lockY = window.scrollY || document.documentElement.scrollTop || 0;
  const doc = document.documentElement;
  doc.classList.add("scroll-locked");
  doc.style.top = `-${lockY}px`;
  doc.style.width = "100%";
  doc.style.overflow = "hidden";
}

/**
 * Unlock the page scroll position
 * Restores the previous scroll position
 */
export function unlockPageScroll() {
  const doc = document.documentElement;
  doc.classList.remove("scroll-locked");
  const y = lockY;
  lockY = 0;
  doc.style.top = "";
  doc.style.width = "";
  doc.style.overflow = "";

  // Use requestAnimationFrame to ensure styles are applied before scrolling
  requestAnimationFrame(() => {
    window.scrollTo({ top: y, behavior: "instant" });
  });
}

/**
 * Hook to manage scroll locking when a modal/sheet is open
 * @param isOpen - Whether the modal is currently open
 */
export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      lockPageScroll();

      // Prevent touchmove on background (for iOS)
      const preventTouchMove = (e: TouchEvent) => {
        // Only prevent if target is not inside a scrollable modal
        const target = e.target as HTMLElement;
        const filterContent = document.querySelector(
          "#filters-scroll, .filter-scroll-area",
        );

        if (filterContent && filterContent.contains(target)) {
          // Allow scrolling inside filter content
          return;
        }

        e.preventDefault();
      };

      document.addEventListener("touchmove", preventTouchMove, {
        passive: false,
      });

      return () => {
        document.removeEventListener("touchmove", preventTouchMove);
        unlockPageScroll();
      };
    } else {
      // Ensure scroll is unlocked if isOpen becomes false
      unlockPageScroll();
    }
  }, [isOpen]);
}
