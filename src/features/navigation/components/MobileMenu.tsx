import { FaUser, FaGlobe } from "react-icons/fa";
import { GiShoppingBag } from "react-icons/gi";
import { MobileMenuProps } from "../types";
import { useLanguage } from "@/shared";

export default function MobileMenu({
  navItems,
  cartItemCount,
  textColor,
  activeDropdown,
  toggleDropdown,
}: MobileMenuProps) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="relative md:hidden">
      {/* Hamburger Button */}
      <button
        className="relative z-10 flex flex-col justify-center items-center w-10 h-10 p-1 bg-black/40 hover:bg-black/60 rounded-full border border-white/30 transition-colors"
        onClick={() => {
          const newDropdown = activeDropdown === "menu" ? null : "menu";
          toggleDropdown(newDropdown === null ? "menu" : "menu");
        }}
        aria-label="Menu"
      >
        <span
          className={`block w-5 h-0.5 transition-transform duration-300 ease-in-out ${
            activeDropdown === "menu" ? "rotate-45 translate-y-1" : ""
          }`}
          style={{ backgroundColor: textColor }}
        ></span>
        <span
          className={`block w-5 h-0.5 my-1 transition-opacity duration-300 ease-in-out ${
            activeDropdown === "menu" ? "opacity-0" : ""
          }`}
          style={{ backgroundColor: textColor }}
        ></span>
        <span
          className={`block w-5 h-0.5 transition-transform duration-300 ease-in-out ${
            activeDropdown === "menu" ? "-rotate-45 -translate-y-1" : ""
          }`}
          style={{ backgroundColor: textColor }}
        ></span>
      </button>

      {/* Mobile Menu Dropdown - Improved */}
      {activeDropdown === "menu" && (
        <div
          className="fixed left-0 right-0 top-[56px] mx-auto w-full max-w-[95%] bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden z-[500]"
          style={{
            animation: "scaleIn 0.2s ease-out forwards",
          }}
        >
          <div className="py-3 space-y-2">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href || "#"}
                className="block px-4 py-2.5 text-gray-800 hover:bg-gray-100 text-center text-lg font-medium transition-colors"
              >
                {t(`nav.${item.label.toLowerCase()}`)}
              </a>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-100"></div>
            <div className="flex justify-center gap-6 py-2">
              <button
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(language === "vi" ? "en" : "vi");
                }}
              >
                <span className="text-sm font-bold flex items-center justify-center flex-col gap-[2px]">
                  <FaGlobe size={14} color="#555" />
                  <span className="text-[10px] text-[#555] uppercase">{language}</span>
                </span>
              </button>
              <button
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown("account");
                }}
                data-dropdown="account"
              >
                <FaUser size={18} color="#555" />
              </button>
              <button
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown("cart");
                }}
                data-dropdown="cart"
              >
                <GiShoppingBag size={18} color="#555" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
