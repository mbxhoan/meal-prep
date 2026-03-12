import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { CarouselControlsProps } from "../types";

export default function CarouselControls({
  onPrev,
  onNext,
  isAnimating,
  isActiveModelLoaded,
  isMobile,
}: CarouselControlsProps) {
  return (
    <div
      className={`absolute flex gap-8 z-50! ${
        isMobile ? "bottom-6" : "bottom-10"
      } left-1/2 -translate-x-1/2 transition-opacity ${
        isActiveModelLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        onClick={onPrev}
        className={`${
          isMobile ? "w-10 h-10" : "w-12 h-12"
        } rounded-full bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)] flex items-center justify-center border-1 border-white/50 text-white transition-all`}
        aria-label="Previous juice"
        disabled={isAnimating || !isActiveModelLoaded}
      >
        <FaChevronLeft size={isMobile ? 16 : 20} />
      </button>
      <button
        onClick={onNext}
        className={`${
          isMobile ? "w-10 h-10" : "w-12 h-12"
        } rounded-full bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)] flex items-center justify-center border-1 border-white/50 text-white transition-all`}
        aria-label="Next juice"
        disabled={isAnimating || !isActiveModelLoaded}
      >
        <FaChevronRight size={isMobile ? 16 : 20} />
      </button>
    </div>
  );
}
