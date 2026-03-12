import { useEffect } from "react";
import Image from "next/image";
import { CanvasContainerProps } from "../types";

export default function CanvasContainer({
  modelPath,
  isMobile,
  isActivePosition,
  onLoaded,
  imageScale = 1,
}: CanvasContainerProps) {
  useEffect(() => {
    // Auto-trigger load since we no longer have GLTF payloads
    if (onLoaded && isActivePosition) {
      const timer = setTimeout(() => {
        onLoaded();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActivePosition, onLoaded]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className="relative transition-all duration-700 pointer-events-auto cursor-pointer"
        style={{
          width: isMobile ? "50%" : "35%",
          height: isMobile ? "50%" : "35%",
          animation: "float-product 6s ease-in-out infinite",
        }}
      >
        <Image
          src={modelPath}
          alt="Product Meal Prep"
          fill
          style={{
            objectFit: "contain",
            filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.5))", // Added a sleek drop shadow since it's transparent!
            transform: `scale(${imageScale})`,
            transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          priority={isActivePosition}
        />
      </div>
      <style jsx>{`
        @keyframes float-product {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(1.5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
