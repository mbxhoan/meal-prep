import { NavLinksProps } from "../types";
import { useLanguage } from "@/shared";

export default function NavLinks({ navItems, textColor }: NavLinksProps) {
  const { t } = useLanguage();

  return (
    <div className="hidden md:flex space-x-8">
      {navItems.map((item, index) => (
        <span
          key={index}
          className="text-lg font-medium cursor-pointer relative group drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{ color: textColor }}
        >
          {t(`nav.${item.label.toLowerCase()}`)}
          <span
            className="absolute left-0 bottom-0 w-0 h-[2px] group-hover:w-full transition-all duration-300"
            style={{ backgroundColor: textColor }}
          />
        </span>
      ))}
    </div>
  );
}
