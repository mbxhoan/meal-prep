/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Image from "next/image";
import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { FruitElementProps } from "../types";
import { calculateAdjustedPosition } from "../utils";

export function FruitElement({
  fruitConfig,
  imagePath,
  animationState,
  fromCenter,
  isMobile,
}: FruitElementProps) {
  const fruitRef = useRef<HTMLDivElement>(null);
  const adjustedLeft = calculateAdjustedPosition(fruitConfig.offsetX, isMobile);

  // Enhanced blur values based on animation state and fruit size
  const getBlurAmount = (state: string, isMoving: boolean): string => {
    // Base blur amount from config
    const baseBlur = fruitConfig.blurAmount || 0;

    // Reduce blur on mobile for performance
    const mobileMultiplier = isMobile ? 0.7 : 1;

    // Enhanced blur for different states
    if (state === "entering" || state === "exiting") {
      return isMoving
        ? `blur(${baseBlur * 3 * mobileMultiplier}px)`
        : `blur(${baseBlur * mobileMultiplier}px)`;
    }

    // Size-dependent blur - larger fruits get more blur
    const sizeMultiplier = fruitConfig.size > 100 ? 1.5 : 1;
    return `blur(${baseBlur * sizeMultiplier * mobileMultiplier}px)`;
  };

  // GSAP animation with enhanced blur effects
  useLayoutEffect(() => {
    const el = fruitRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      if (animationState === "visible") {
        gsap.set(el, {
          left: adjustedLeft,
          top: fruitConfig.offsetY,
          opacity: 1,
          filter: getBlurAmount("visible", false),
          transform: `translate(-50%, -50%) ${fruitConfig.rotation} scale(1)`,
        });
      }
      if (animationState === "entering" && fromCenter) {
        gsap.set(el, {
          left: "50%",
          top: "50%",
          opacity: 1,
          filter: getBlurAmount("entering", true),
          transform: "translate(-50%, -50%) scale(0.2)",
        });
        gsap.to(el, {
          left: adjustedLeft,
          top: fruitConfig.offsetY,
          filter: getBlurAmount("visible", false),
          transform: `translate(-50%, -50%) ${fruitConfig.rotation} scale(1)`,
          duration: isMobile ? 0.8 : 1, // Slightly faster animation on mobile
          ease: "power2.out",
        });
      }
      if (animationState === "exiting" && !fromCenter) {
        gsap.set(el, {
          left: adjustedLeft,
          top: fruitConfig.offsetY,
          opacity: 1,
          filter: getBlurAmount("visible", false),
          transform: `translate(-50%, -50%) ${fruitConfig.rotation} scale(1)`,
        });
        gsap.to(el, {
          left: "50%",
          top: "50%",
          opacity: 0,
          filter: getBlurAmount("exiting", true),
          transform: "translate(-50%, -50%) scale(0.2)",
          duration: isMobile ? 0.8 : 1, // Slightly faster animation on mobile
          ease: "power2.in",
        });
      }
    }, fruitRef);

    return () => ctx.revert();
  }, [
    animationState,
    fromCenter,
    adjustedLeft,
    fruitConfig.offsetY,
    fruitConfig.rotation,
    fruitConfig.blurAmount,
    fruitConfig.size,
    isMobile,
  ]);

  // Add motion blur container to enhance blur effect
  return (
    <div
      ref={fruitRef}
      className="absolute pointer-events-none select-none"
      style={{
        zIndex: fruitConfig.zIndex,
        width: `${fruitConfig.size}px`,
        height: `${fruitConfig.size}px`,
        transformOrigin: "center center",
      }}
    >
      <div className="relative w-full h-full motion-blur-container">
        <Image
          src={imagePath}
          alt="Spices"
          width={fruitConfig.size}
          height={fruitConfig.size}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          className="object-contain"
        />
      </div>
    </div>
  );
}

export default FruitElement;
