"use client";
import { useMobile } from "@/shared/hooks";
import { SizeSelectorProps } from "../types";

export default function SizeSelector({
  sizes,
  selectedColor = "white",
  unselectedColor = "#82AF38",
  textColor = "#82AF38",
  selectedTextColor = "white",
}: SizeSelectorProps) {
  const isMobile = useMobile();

  return (
    <div
      className={`absolute z-[50]! ${
        isMobile
          ? "left-1/2 -translate-x-1/2 top-[calc(2rem+56px)] flex flex-row gap-4"
          : "right-[clamp(2rem,4.8vw,9rem)] top-1/2 -translate-y-1/2 flex flex-col gap-4"
      }`}
    >
      {sizes.map((option, index) => (
        <button
          key={index}
          type="button"
          className={`${
            isMobile ? "w-[60px] h-[60px]" : "w-[80px] h-[80px]"
          } border-1 border-white/50 rounded-full flex items-center justify-center flex-col cursor-pointer transition-all duration-300`}
          style={{
            backgroundColor: option.selected ? selectedColor : unselectedColor,
            color: option.selected ? textColor : selectedTextColor,
            outline: "none",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = option.selected ? "1" : "0.8";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          aria-pressed={option.selected}
        >
          <span className={`font-bold ${isMobile ? "text-sm" : ""}`}>
            {option.size}
          </span>
          <span className={`${isMobile ? "text-[10px]" : "text-xs"}`}>
            {option.unit}
          </span>
        </button>
      ))}
    </div>
  );
}
