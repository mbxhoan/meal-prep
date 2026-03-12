import { FloatingFruits } from "@/features/floating-fruits";
import { FruitsContainerProps } from "../types";

export default function FruitsContainer({
  isVisible,
  currentJuiceType,
  nextJuiceType,
  isTransitioning,
}: FruitsContainerProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute w-full h-full inset-0 flex items-center justify-center z-0 pointer-events-none">
      <FloatingFruits
        currentJuice={currentJuiceType}
        nextJuice={nextJuiceType}
        isTransitioning={isTransitioning}
      />
    </div>
  );
}
