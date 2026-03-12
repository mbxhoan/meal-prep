"use client";
import { memo } from "react";
import { useMobile } from "@/shared/hooks";
import { ColumnProps } from "../types";
import { IceElement } from "./IceElement";

export const IceColumn = memo(
  function IceColumn({
    side,
    elements,
    containerWidth,
    mounted,
    columnRef,
  }: ColumnProps) {
    const isMobile = useMobile();

    return (
      <div
        ref={columnRef}
        className={`absolute ${side}-0 top-0 h-full z-10 ${
          isMobile ? "hidden" : ""
        } 
        ${mounted ? "opacity-100" : "opacity-0"}
        ${side === "left" ? "-translate-x-[50%]" : "translate-x-[50%]"}
         `}
        style={{
          width: `calc((100% - ${containerWidth}px) / 2)`,
          transition: "opacity 0.01s ease-in",
        }}
      >
        {elements.map((element, index) => (
          <IceElement
            key={`${side}-${index}`}
            element={element}
            side={side}
            mounted={mounted}
            index={index}
          />
        ))}
      </div>
    );
  },
  // Custom equality function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render when mounted changes from false to true
    // or when essential props actually change
    if (prevProps.mounted === false && nextProps.mounted === true) {
      return false; // Allow re-render for initial mounting
    }

    // Otherwise, prevent re-renders
    const sideEqual = prevProps.side === nextProps.side;
    const widthEqual = prevProps.containerWidth === nextProps.containerWidth;
    const elementsEqual =
      prevProps.elements.length === nextProps.elements.length &&
      JSON.stringify(prevProps.elements) === JSON.stringify(nextProps.elements);

    return sideEqual && widthEqual && elementsEqual;
  }
);

export default IceColumn;
