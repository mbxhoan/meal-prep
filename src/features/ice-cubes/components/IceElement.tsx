"use client";
import Image from "next/image";
import { ElementProps } from "../types";
import { getImagePath } from "../utils";

export function IceElement({ element, side, mounted, index }: ElementProps) {
  let blurAmount = 0;
  if (mounted && element.blurLevel === 1) {
    blurAmount = 1.5;
  } else if (mounted && element.blurLevel === 2) {
    blurAmount = 3;
  }

  const transform = mounted
    ? `${element.rotation} scaleX(${element.flipX || 1}) scaleY(${
        element.flipY || 1
      })`
    : "none";

  const positionSeed = (index * 13 + (side === "left" ? 7 : 17)) % 30;
  const position = mounted ? `${positionSeed}%` : "0%";

  return (
    <div
      key={`${side}-${index}`}
      className={`absolute ${side}-cube`}
      style={{
        [side === "left" ? "left" : "right"]: position,
        top: element.offsetY,
        transform,
        zIndex: element.zIndex,
        opacity: mounted ? element.opacity : 0,
        width: `${element.size}px`,
        height: `${element.size}px`,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : "none",
      }}
    >
      {mounted && (
        <Image
          src={getImagePath(element.elementType, element.variant)}
          alt="Spices"
          width={element.size}
          height={element.size}
          className="object-contain"
        />
      )}
    </div>
  );
}

export default IceElement;
