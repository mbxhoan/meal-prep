"use client";
import { useEffect, useState } from "react";
import { useMobile } from "@/shared/hooks";
import { getFruitImagePath, getFruitConfigs } from "../utils";
import { FruitElement } from "./FruitElement";
import { FloatingFruitsProps } from "../types";

export default function FloatingFruits({
  currentJuice,
  nextJuice,
  isTransitioning,
}: FloatingFruitsProps) {
  const [exitingJuice, setExitingJuice] = useState<string | null>(null);
  const [showEntering, setShowEntering] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const isMobile = useMobile();

  // Normal transition logic for subsequent changes
  useEffect(() => {
    // Handle first render differently - always animate from center
    if (isFirstRender) {
      setShowEntering(true);
      setIsFirstRender(false);
      return;
    }

    // Normal transition logic for subsequent changes
    if (nextJuice && isTransitioning) {
      setExitingJuice(currentJuice);
      setShowEntering(false);
      // Start entering after 500ms (halfway through exit)
      const timer = setTimeout(() => {
        setShowEntering(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!nextJuice && isTransitioning) {
      setExitingJuice(null);
      setShowEntering(true);
    }
  }, [nextJuice, currentJuice, isTransitioning, isFirstRender]);

  const fruitConfigs = getFruitConfigs(isMobile);

  return (
    <div
      className="relative w-[200px] h-[600px]  pointer-events-none z-20"
      style={{
        transform: isMobile ? "scale(0.75)" : "none",
        transformOrigin: "center center",
      }}
    >
      {/* Entering fruits: from center to position */}
      {((nextJuice && showEntering) || (!nextJuice && showEntering)) && (
        <div className="absolute inset-0">
          {fruitConfigs.map((config) => (
            <FruitElement
              key={`entering-${config.position}-${nextJuice || currentJuice}`}
              fruitConfig={config}
              imagePath={getFruitImagePath(nextJuice || currentJuice)}
              animationState="entering"
              fromCenter={true}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* Exiting fruits: from position to center */}
      {exitingJuice && (
        <div className="absolute inset-0">
          {fruitConfigs.map((config) => (
            <FruitElement
              key={`exiting-${config.position}-${exitingJuice}`}
              fruitConfig={config}
              imagePath={getFruitImagePath(exitingJuice)}
              animationState="exiting"
              fromCenter={false}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* Show visible state if not transitioning AND not first render */}
      {!isTransitioning && !isFirstRender && (
        <div className="absolute inset-0">
          {fruitConfigs.map((config) => (
            <FruitElement
              key={`visible-${config.position}-${currentJuice}`}
              fruitConfig={config}
              imagePath={getFruitImagePath(currentJuice)}
              animationState="visible"
              fromCenter={false}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
