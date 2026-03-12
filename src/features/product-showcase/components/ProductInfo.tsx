"use client";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useMobile } from "@/shared/hooks";
import { ProductInfoProps } from "../types";

export default function ProductInfo({
  title,
  juiceData,
  buttonText,
  buttonBgColor = "white",
  buttonTextColor = "#82AF38",
}: ProductInfoProps) {
  // Create stable refs for elements that shouldn't re-render
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Content elements that will animate
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const [renderDelayComplete, setRenderDelayComplete] = useState(false);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const previousTitle = useRef<string>(title);
  const isMobile = useMobile();

  // Add delay on initial render only
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderDelayComplete(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Handle content updates and animations
  useEffect(() => {
    if (!renderDelayComplete) return;

    // If the title has changed, animate content change
    if (previousTitle.current !== title && contentWrapperRef.current) {
      // Kill any existing animations
      if (animationRef.current) {
        animationRef.current.kill();
      }

      const juice = juiceData[title];

      // Update content
      if (titleRef.current) titleRef.current.textContent = juice?.title || "";
      if (descriptionRef.current)
        descriptionRef.current.textContent = juice?.description || "";

      // Create new animation with optimized settings
      animationRef.current = gsap.fromTo(
        contentWrapperRef.current,
        {
          opacity: 0,
          y: 20,
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          delay: 0.1,
          overwrite: true,
          clearProps: "transform",
        }
      );

      // Update previous title reference
      previousTitle.current = title;
    }

    // Update button colors if they change
    if (buttonRef.current) {
      buttonRef.current.style.backgroundColor = buttonBgColor;
      buttonRef.current.style.color = buttonTextColor;
    }
  }, [title, juiceData, renderDelayComplete, buttonBgColor, buttonTextColor]);

  // Get initial juice data
  const initialJuice = juiceData[title];

  return (
    <div
      ref={containerRef}
      className={`${
        isMobile
          ? "absolute bottom-14 left-4 right-4 max-w-full min-w-0"
          : "absolute bottom-2 left-20 max-w-[560px] min-w-[400px]"
      }`}
      style={{
        opacity: renderDelayComplete ? 1 : 0,
        transition: "opacity 0.3s ease",
        visibility: renderDelayComplete ? "visible" : "hidden",
      }}
    >
      <div className="mb-4 min-w-full">
        <div
          className={`relative w-full mb-[6px] p-3 ${
            isMobile ? "px-4" : "px-6"
          } rounded-xl overflow-hidden`}
        >
          {/* Animated content wrapper - only this part changes */}
          <div
            ref={contentWrapperRef}
            className="relative"
            style={{ willChange: "transform, opacity" }}
          >
            <h1
              ref={titleRef}
              className={`text-shadow-xs ${
                isMobile ? "text-4xl mb-2" : "text-5xl mb-4"
              } font-light  text-white`}
            >
              {initialJuice?.title}
            </h1>
            <p
              ref={descriptionRef}
              className={`text-white ${
                isMobile ? "text-base line-clamp-3" : "text-xl"
              } text-shadow-xs`}
            >
              {initialJuice?.description}
            </p>
          </div>
          {/* Button that stays stable with updated hover behavior */}
          <button
            ref={buttonRef}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 mt-4 ${
              isMobile ? "text-sm hidden" : ""
            }`}
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
