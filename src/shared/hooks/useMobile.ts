"use client";
import { useState, useEffect } from "react";

/**
 * Custom hook to detect mobile screen size
 * @param breakpoint - The pixel width breakpoint (default: 600)
 * @returns boolean indicating if the screen is mobile size
 */
export function useMobile(breakpoint: number = 600): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= breakpoint);
        };

        // Set initial value
        checkMobile();

        // Add resize listener
        window.addEventListener("resize", checkMobile);

        // Cleanup listener
        return () => window.removeEventListener("resize", checkMobile);
    }, [breakpoint]);

    return isMobile;
}

export default useMobile;
