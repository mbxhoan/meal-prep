"use client";
import { useMobile } from "../hooks";

interface BlurredBackgroundProps {
  color?: string;
  blurAmount?: number;
  size?: number;
}

export default function BlurredBackground({
  color = "#E5F985",
  blurAmount = 610,
  size = 700,
}: BlurredBackgroundProps) {
  const isMobile = useMobile();

  const mobileSize = isMobile ? size * 0.6 : size; // Reduce size on mobile
  const mobileBlur = isMobile ? blurAmount * 0.7 : blurAmount; // Slightly reduce blur on mobile for performance

  return (
    <div
      className="absolute rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        backgroundColor: color,
        filter: `blur(${mobileBlur}px)`,
        width: `${mobileSize}px`,
        height: `${mobileSize}px`,
        transition: "all 1s ease-in-out",
        zIndex: 22,
      }}
    />
  );
}
