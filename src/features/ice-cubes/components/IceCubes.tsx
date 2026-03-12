"use client";
import { useRef, useEffect, useState, memo } from "react";
import gsap from "gsap";
import { IceColumn } from "./IceColumn";
import { ElementConfig, IceCubesProps } from "../types";
import { generateColumnElements, processElementsForBlur } from "../utils";

// Memoize the entire IceCubes component to prevent unnecessary re-renders
const IceCubes = memo(function IceCubes({
  containerWidth = 1220,
  cubeCount = 6,
  leafCount = 4,
}: IceCubesProps) {
  // State to track client-side rendering
  const [mounted, setMounted] = useState(false);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // Empty placeholder elements for server-side rendering to avoid hydration mismatch
  const serverSideLeftElements = Array(cubeCount + leafCount)
    .fill(null)
    .map((_, i) => ({
      size: 50,
      rotation: "none",
      flipX: 1,
      flipY: 1,
      zIndex: 10,
      opacity: 0,
      elementType: "cube" as const,
      offsetY: `${i * 10}%`,
      animationDelay: 0,
      blurLevel: 0,
    }));

  const serverSideRightElements = Array(cubeCount + leafCount)
    .fill(null)
    .map((_, i) => ({
      size: 50,
      rotation: "none",
      flipX: 1,
      flipY: 1,
      zIndex: 10,
      opacity: 0,
      elementType: "cube" as const,
      offsetY: `${i * 10}%`,
      animationDelay: 0,
      blurLevel: 0,
    }));

  // Fix: Make the ref type nullable and initialize with null
  const generatedElementsRef = useRef<{
    left: ElementConfig[];
    right: ElementConfig[];
  } | null>(null);
  if (!generatedElementsRef.current) {
    const left = processElementsForBlur(
      generateColumnElements("left", cubeCount, leafCount)
    );
    const right = processElementsForBlur(
      generateColumnElements("right", cubeCount, leafCount)
    );
    generatedElementsRef.current = { left, right };
  }

  // Only initialize elements after component mounts on client
  useEffect(() => {
    setMounted(true);

    // Create a single GSAP context for better performance
    const ctx = gsap.context(() => {
      setTimeout(() => {
        const leftCubeElements = document.querySelectorAll(".left-cube");
        const rightCubeElements = document.querySelectorAll(".right-cube");

        // Batch animations for better performance
        const tl = gsap.timeline();

        // Animate left cubes with fewer individual tweens
        leftCubeElements.forEach((cube, index) => {
          if (
            generatedElementsRef.current &&
            index < generatedElementsRef.current.left.length
          ) {
            tl.to(
              cube,
              {
                y: "+=10",
                rotation: "+=5",
                duration: 2 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
                delay: generatedElementsRef.current.left[index].animationDelay,
              },
              index * 0.05 // Stagger for better performance
            );
          }
        });

        // Animate right cubes with fewer individual tweens
        rightCubeElements.forEach((cube, index) => {
          if (
            generatedElementsRef.current &&
            index < generatedElementsRef.current.right.length
          ) {
            tl.to(
              cube,
              {
                y: "+=10",
                rotation: "-=5",
                duration: 2 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
                delay: generatedElementsRef.current.right[index].animationDelay,
              },
              index * 0.05 // Stagger for better performance
            );
          }
        });
      }, 100);
    });

    // Proper cleanup of GSAP animations
    return () => ctx.revert();
  }, []);

  // Use server-side elements for initial render, client-side after mount
  const leftElements =
    mounted && generatedElementsRef.current
      ? generatedElementsRef.current.left
      : serverSideLeftElements;
  const rightElements =
    mounted && generatedElementsRef.current
      ? generatedElementsRef.current.right
      : serverSideRightElements;

  return (
    <>
      <IceColumn
        side="left"
        elements={leftElements}
        containerWidth={containerWidth}
        mounted={mounted}
        columnRef={leftColumnRef as React.RefObject<HTMLDivElement>}
      />
      <IceColumn
        side="right"
        elements={rightElements}
        containerWidth={containerWidth}
        mounted={mounted}
        columnRef={rightColumnRef as React.RefObject<HTMLDivElement>}
      />
    </>
  );
});

export default IceCubes;
