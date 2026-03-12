"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";

// Shared components
import { AnimatedBackground, BlurredBackground } from "@/shared";
import { useMobile } from "@/shared/hooks";

// Feature imports
import { NavBar } from "@/features/navigation";
import {
  ProductInfo,
  ProductLogo,
  SizeSelector,
  ScrollDownButton,
  canThemeMap,
  juiceData,
  JuiceName,
} from "@/features/product-showcase";
import { JuiceCarousel } from "@/features/carousel";
import { IceCubes } from "@/features/ice-cubes";

// App config
import { pageContent } from "@/config";

// Optimize loading with specific settings to improve performance
const WaterWave = dynamic(() => import("react-water-wave"), {
  ssr: false,
  loading: () => (
    <div className="h-screen max-h-[1100px] overflow-hidden relative"></div>
  ),
});

export default function Home() {
  // Default to Lemon Ginger
  const [theme, setTheme] = useState(canThemeMap["Lemon Ginger"]);
  const [productTitle, setProductTitle] = useState("Lemon Ginger");
  const [, setProductDesc] = useState(pageContent.product.description);
  const isMobile = useMobile();

  const containerWidth = 1220;

  // Memoize the props for IceCubes to ensure stable references
  const iceCubesProps = useMemo(
    () => ({
      theme,
      containerWidth,
      cubeCount: isMobile ? 6 : 8, // Reduce number of elements on mobile
      leafCount: isMobile ? 10 : 14, // Reduce number of elements on mobile
    }),
    [theme, containerWidth, isMobile]
  );

  // Update body background color when theme changes, with improved timing
  useEffect(() => {
    // Apply transition without delay first
    document.body.style.transition = "all 0.6s ease-in-out 0.3s";

    document.body.style.backgroundColor = theme.mainBgColor;
  }, [theme.mainBgColor]);

  // Callback for JuiceCarousel with debounce to prevent rapid changes
  const handleCanChange = (canName: string) => {
    // Type check to ensure canName is a valid key in canThemeMap
    if (Object.keys(canThemeMap).includes(canName)) {
      const typedCanName = canName as JuiceName;
      setTheme(canThemeMap[typedCanName]);
      setProductTitle(canName);
      setProductDesc(juiceData[typedCanName].description);
    }
  };

  return (
    <div className="relative w-full max-w-[1440px] mx-auto max-h-screen sm:max-h-900px h-[100dvh] shadow-2xl select-none border-x-1 border-white/30">
      <IceCubes {...iceCubesProps} />
      <NavBar
        logo={pageContent.nav.logo}
        navItems={pageContent.nav.items}
        cartItemCount={pageContent.nav.cartCount}
        textColor="white"
        themeColor={theme.mainBgColor} // Pass theme color to NavBar
        buttonTextColor={theme.buttonTextColor} // Pass button text color to NavBar
      />
      <WaterWave
        dropRadius={isMobile ? 8 : 10}
        perturbance={isMobile ? 0.006 : 0.01}
        imageUrl="/assets/images/drop.png"
        resolution={isMobile ? 700 : 1900}
      >
        {() => (
          <div className="max-h-screen sm:max-h-900px h-[100dvh] overflow-hidden w-full relative">
            {/* Background as a separate component that handles its own animation */}
            <AnimatedBackground
              backgroundColor={theme.mainBgColor}
              duration={1}
            />

            {/* Blurred background */}
            <div
              className="absolute top-0 left-0 w-full h-full z-[0]!  bg-black/5"
              style={{ backdropFilter: "blur(0px)" }}
            />

            <div
              className={`max-w-[1440px] ${
                isMobile ? "px-4" : "pr-5 pl-[70px]"
              } h-full w-fzll max-h-[1080px] m-auto relative`}
            >
              {/* Blurred background */}
              <BlurredBackground color={theme.blurColor} />

              {/* ProductLogo always fixed as "JUICY" and always white */}
              <ProductLogo
                isMobile={isMobile}
                text="JUICY"
                color="white"
                className="theme-text "
              />

              {/* Juice Carousel with can change callback */}
              <div
                className={`${
                  isMobile ? "relative" : "absolute"
                }  top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full h-full z-50`}
              >
                <JuiceCarousel
                  onCanChange={handleCanChange}
                  enableScrollNavigation={true}
                />
              </div>

              <SizeSelector
                sizes={pageContent.sizes}
                selectedColor={theme.buttonBgColor}
                unselectedColor={theme.mainBgColor}
                textColor={theme.mainBgColor}
                selectedTextColor="white"
              />

              <ProductInfo
                title={productTitle}
                juiceData={juiceData}
                buttonText={pageContent.product.buttonText}
                buttonBgColor={theme.buttonBgColor}
                buttonTextColor={theme.buttonTextColor}
              />

              <ScrollDownButton
                firstLine={pageContent.scroll.firstLine}
                secondLine={pageContent.scroll.secondLine}
                textColor="white"
                isMobile={isMobile}
                themeColor={theme.mainBgColor}
              />
            </div>
          </div>
        )}
      </WaterWave>
    </div>
  );
}
