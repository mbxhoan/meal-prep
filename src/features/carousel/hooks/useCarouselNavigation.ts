import { useEffect, useRef } from 'react';

type NavigationCallback = () => void;

/**
 * Custom hook to handle carousel navigation through scroll and keyboard events
 */
export function useCarouselNavigation(
    onNext: NavigationCallback,
    onPrev: NavigationCallback,
    isAnimating: boolean,
    isActive: boolean,
    enabled: boolean = true
) {
    // Create a ref to track the last navigation time for throttling
    const lastNavigationTime = useRef<number>(0);
    // Minimum time between navigations to prevent rapid transitions (in ms)
    const throttleDelay = 800;

    // Handle scroll events
    useEffect(() => {
        if (!enabled) return;

        const handleWheel = (e: WheelEvent) => {
            // Skip if component is not active or already animating
            if (isAnimating || !isActive) return;

            // Get current time to apply throttling
            const now = Date.now();
            if (now - lastNavigationTime.current < throttleDelay) return;

            // Determine scroll direction
            // For vertical scroll - e.deltaY (positive is down, negative is up)
            // For horizontal scroll - e.deltaX (positive is right, negative is left)
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                // Vertical scrolling is dominant
                if (e.deltaY > 0) {
                    // Scrolling down
                    onPrev();
                } else {
                    // Scrolling up
                    onNext();
                }
            } else {
                // Horizontal scrolling is dominant
                if (e.deltaX > 0) {
                    // Scrolling right
                    onPrev();
                } else {
                    // Scrolling left
                    onNext();
                }
            }

            // Update last navigation time
            lastNavigationTime.current = now;
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [onNext, onPrev, isAnimating, isActive, enabled, throttleDelay]);

    // Handle keyboard events
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if component is not active or already animating
            if (isAnimating || !isActive) return;

            // Check for focused input elements to prevent navigation when typing
            const activeElement = document.activeElement;
            if (
                activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.hasAttribute('contenteditable')
            ) {
                return;
            }

            // Get current time to apply throttling
            const now = Date.now();
            if (now - lastNavigationTime.current < throttleDelay) return;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowUp':
                    onNext();
                    lastNavigationTime.current = now;
                    break;
                case 'ArrowLeft':
                case 'ArrowDown':
                    onPrev();
                    lastNavigationTime.current = now;
                    break;
                default:
                    // Ignore other keys
                    return;
            }

            // Prevent default browser behavior for arrow keys
            e.preventDefault();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onNext, onPrev, isAnimating, isActive, enabled, throttleDelay]);
}
