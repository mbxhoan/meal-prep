"use client";
import { useSyncExternalStore } from "react";

/**
 * Custom hook to detect mobile screen size
 * @param breakpoint - The pixel width breakpoint (default: 600)
 * @returns boolean indicating if the screen is mobile size
 */
export function useMobile(breakpoint: number = 600): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
      const handleChange = () => onStoreChange();

      mediaQuery.addEventListener("change", handleChange);
      window.addEventListener("resize", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
        window.removeEventListener("resize", handleChange);
      };
    },
    () => {
      if (typeof window === "undefined") {
        return false;
      }

      return window.innerWidth <= breakpoint;
    },
    () => false,
  );
}

export default useMobile;
