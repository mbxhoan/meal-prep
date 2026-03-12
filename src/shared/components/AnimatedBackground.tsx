"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";

interface AnimatedBackgroundProps {
  backgroundColor: string;
  duration?: number;
}

export default function AnimatedBackground({
  backgroundColor,
}: AnimatedBackgroundProps) {
  const [currentColor, setCurrentColor] = useState(backgroundColor);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const currentBgRef = useRef<HTMLDivElement>(null);
  const nextBgRef = useRef<HTMLDivElement>(null);
  const [initialRender, setInitialRender] = useState(true);
  const [, setIsAnimating] = useState(false);

  // Pre-create the animation timeline for reuse
  const createAnimation = useCallback(
    (nextBgElement: HTMLDivElement, newColor: string) => {
      // Kill any existing animations
      if (animationRef.current) {
        animationRef.current.kill();
      }

      // Pre-configure next background for animation
      nextBgElement.style.backgroundColor = "";
      nextBgElement.style.background = `radial-gradient(circle, ${newColor} 90%, ${newColor}00 100%)`;
      nextBgElement.style.boxShadow = `0 0 70px 20px ${newColor}`;
      nextBgElement.style.display = "block";

      // Apply initial GSAP properties with force3D for hardware acceleration
      gsap.set(nextBgElement, {
        clipPath: "circle(0% at center)",
        scale: 0.1,
        opacity: 1,
        zIndex: 5,
        force3D: true, // Force hardware acceleration
        willChange: "transform", // Hint to browser for optimization
      });

      // Create the optimized timeline
      return gsap.timeline({
        onComplete: () => {
          setCurrentColor(newColor);
          setIsAnimating(false);

          // Update DOM after animation completes
          if (currentBgRef.current) {
            currentBgRef.current.style.backgroundColor = newColor;
          }
          nextBgElement.style.display = "none";
        },
      });
    },
    []
  );

  // Optimized effect for background color change
  useEffect(() => {
    // On first render, just set the color directly
    if (initialRender) {
      if (currentBgRef.current) {
        currentBgRef.current.style.backgroundColor = backgroundColor;
      }
      setInitialRender(false);
      setCurrentColor(backgroundColor);
      return;
    }

    // Skip if color hasn't changed
    if (backgroundColor === currentColor) return;

    // Ensure we have DOM refs
    if (!currentBgRef.current || !nextBgRef.current) return;

    // Prepare for animation immediately
    setIsAnimating(true);

    // Use requestAnimationFrame to start animation on next frame for smoother transition
    requestAnimationFrame(() => {
      const tl = createAnimation(nextBgRef.current!, backgroundColor);

      // Start the animation immediately
      tl.to(nextBgRef.current, {
        clipPath: "circle(150% at center)",
        scale: 10,
        duration: 2,
        ease: "power3.out",
        immediateRender: true, // Start immediately
      });

      // Store reference
      animationRef.current = tl;
    });
  }, [backgroundColor, currentColor, initialRender, createAnimation]);

  return (
    <>
      {/* Base background with current color */}
      <div ref={currentBgRef} className="absolute inset-0 z-[-2] " />

      {/* Animated overlay - pre-positioned for faster animation start */}
      <div
        ref={nextBgRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2  -translate-y-1/2 z-[-1]! w-[200px] h-[200px] rounded-full"
        style={{
          display: "none",
          transformOrigin: "center center",
          willChange: "transform, opacity", // Performance optimization hint
        }}
      />
    </>
  );
}
