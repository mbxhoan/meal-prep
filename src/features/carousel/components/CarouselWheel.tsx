import { useRef } from "react";
import { juiceCans, positionConfigs } from "../config";
import CanvasContainer from "./CanvasContainer";
import { CarouselWheelProps } from "../types";

export default function CarouselWheel({
  activeIndex,
  isMobile,
  onActiveModelLoaded,
  wheelRef,
  imageScale = 1,
}: CarouselWheelProps) {
  const canModelsRef = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <div
      ref={wheelRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{ transformOrigin: "center center" }}
    >
      {juiceCans.map((can, index) => (
        <div
          key={can.name}
          className={`${positionConfigs[index].className} ${
            isMobile ? "w-[40%] h-[40%] mx-auto" : "w-1/2 h-1/2"
          } transform-gpu`}
          style={{
            transformOrigin: positionConfigs[index].transformOrigin,
            willChange: "transform",
          }}
          ref={(el) => {
            canModelsRef.current[index] = el;
          }}
        >
          <CanvasContainer
            modelPath={can.model}
            rotation={positionConfigs[index].rotation}
            isMobile={isMobile}
            isActivePosition={index === activeIndex}
            onLoaded={onActiveModelLoaded}
            imageScale={imageScale}
          />
        </div>
      ))}
    </div>
  );
}
