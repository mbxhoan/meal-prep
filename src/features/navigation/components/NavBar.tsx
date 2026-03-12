"use client";
import { useState, useRef, useEffect } from "react";
import { FaUser, FaGlobe } from "react-icons/fa";
import { GiShoppingBag } from "react-icons/gi";
import { useMobile, useLanguage } from "@/shared";
import { NavBarProps } from "../types";
import { sampleCartItems } from "../config";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import AccountDropdown from "./AccountDropdown";
import CartDropdown from "./CartDropdown";

export default function NavBar({
  logo,
  navItems,
  cartItemCount,
  textColor = "white",
  bgColor = "transparent",
  // bgColor = "rgba(0, 0, 0, 0.1)",
  themeColor = "#82AF38",
}: NavBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<
    "cart" | "account" | "menu" | null
  >(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();
  const { language, setLanguage } = useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;

      // Check if clicking on dropdown buttons
      const clickingDropdownButton = target.closest("[data-dropdown]");
      if (clickingDropdownButton) {
        const buttonType = clickingDropdownButton.getAttribute("data-dropdown");
        // If clicking cart/account from menu, don't close menu
        if (
          activeDropdown === "menu" &&
          (buttonType === "cart" || buttonType === "account")
        ) {
          return;
        }
      }

      // Check each dropdown separately
      if (
        activeDropdown === "cart" &&
        cartRef.current &&
        !cartRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }

      if (
        activeDropdown === "account" &&
        accountRef.current &&
        !accountRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }

      if (
        activeDropdown === "menu" &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  // Toggle dropdown visibility
  const toggleDropdown = (dropdown: "cart" | "account" | "menu") => {
    setActiveDropdown((prev) => {
      // If clicking the same dropdown that's already open, close it
      if (prev === dropdown) return null;

      return dropdown;
    });
  };

  return (
    <div
      className="flex fixed left-1/2 border-b-1 border-white/30 -translate-x-1/2 top-0 w-full max-w-[1440px] items-center justify-between ps-[6.2%] pe-[5.5%] py-3 z-[100] select-none"
      style={{
        backgroundColor: bgColor,
        backdropFilter: "blur(2px)",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Logo */}
      <div
        className="text-2xl uppercase font-bold cursor-default"
        style={{
          color: textColor,
          fontWeight: 900,
        }}
      >
        {logo}
      </div>

      {/* Navigation Links - Desktop */}
      <NavLinks navItems={navItems} textColor={textColor} />

      {/* Mobile Menu */}
      {isMobile && (
        <div ref={menuRef}>
          <MobileMenu
            navItems={navItems}
            cartItemCount={cartItemCount}
            themeColor={themeColor}
            textColor={textColor}
            activeDropdown={activeDropdown}
            toggleDropdown={toggleDropdown}
          />
        </div>
      )}

      {/* User and Cart Icons - Desktop */}
      <div className={`${isMobile ? "hidden" : "flex"} items-center space-x-4`}>
        {/* Language Switcher */}
        <div 
          className="relative cursor-pointer hover:opacity-100 transition-all duration-300 flex items-center bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full border border-white/30" 
          onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
        >
          <span className="text-sm font-bold flex items-center gap-2" style={{ color: "white" }}>
            <FaGlobe size={14} className="opacity-80" />
            {language === "vi" ? (
              <>
                <span className="text-lg leading-none mt-[1px]">🇻🇳</span>
                <span>VI</span>
              </>
            ) : (
              <>
                <span className="text-lg leading-none mt-[1px]">🇺🇸</span>
                <span>EN</span>
              </>
            )}
          </span>
        </div>

        {/* Account Icon with Dropdown */}
        <div ref={accountRef} className="relative">
          <span
            className="cursor-pointer hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black/40 hover:bg-black/60 w-9 h-9 rounded-full border border-white/30"
            style={{ color: "white" }}
            onClick={() => toggleDropdown("account")}
          >
            <FaUser size={16} />
          </span>

          {/* Account Dropdown Menu - Desktop */}
          {!isMobile && activeDropdown === "account" && (
            <AccountDropdown themeColor={themeColor} isDesktop={true} />
          )}
        </div>

        {/* Cart Icon with Dropdown */}
        <div ref={cartRef} className="relative">
          <span
            className="relative cursor-pointer hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black/40 hover:bg-black/60 w-9 h-9 rounded-full border border-white/30"
            style={{ color: "white" }}
            onClick={() => toggleDropdown("cart")}
          >
            <GiShoppingBag size={18} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </span>

          {/* Cart Dropdown Menu - Desktop */}
          {!isMobile && activeDropdown === "cart" && (
            <CartDropdown
              cartItems={sampleCartItems}
              themeColor={themeColor}
              isDesktop={true}
            />
          )}
        </div>
      </div>

      {/* Mobile Dropdowns - positioned at top of screen */}
      {isMobile && activeDropdown === "cart" && (
        <CartDropdown
          cartItems={sampleCartItems}
          themeColor={themeColor}
          isDesktop={false}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {isMobile && activeDropdown === "account" && (
        <AccountDropdown
          themeColor={themeColor}
          isDesktop={false}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .styled-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .styled-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .styled-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
