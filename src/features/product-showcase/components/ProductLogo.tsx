"use client";
import { JuicyLogoProps } from "../types";

export default function ProductLogo({
  text,
  color = "white",
  fontSize = "clamp(10rem,10rem + 15vw,29rem)",
  fontFamily = "var(--font-thunder), sans-serif",
  className = "",
  isMobile = false,
}: JuicyLogoProps) {
  return (
    <div className="absolute z-[-1]! left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
      <h1
        className={`leading-none select-none ${className} `}
        style={{
          fontFamily,
          color,
          fontWeight: 500,
          fontSize: isMobile ? "clamp(5rem,9rem + 15vw,10rem)" : fontSize,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          display: "inline-block",
          textShadow: "0px 2px 10px rgba(0,0,0,0.8), 0px 1px 3px rgba(0,0,0,0.8)"
        }}
      >
        {text}
      </h1>
    </div>
  );
}
