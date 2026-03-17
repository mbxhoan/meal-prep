"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

// Shared components
import { AnimatedBackground, BlurredBackground, useLanguage } from "@/shared";
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
  ProductName,
} from "@/features/product-showcase";
import { JuiceCarousel } from "@/features/carousel";
import { IceCubes } from "@/features/ice-cubes";

// App config
import { pageContent } from "@/config";

// Removed WaterWave

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState(canThemeMap["Marinated Chicken"]);
  const [productTitle, setProductTitle] = useState("Marinated Chicken");
  const [, setProductDesc] = useState(pageContent.product.description);
  const [activeSize, setActiveSize] = useState("500");
  const isMobile = useMobile();
  const { t } = useLanguage();

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
      const typedCanName = canName as ProductName;
      setTheme(canThemeMap[typedCanName]);
      setProductTitle(canName);
      setProductDesc(juiceData[typedCanName].description);
    }
  };

  const dynamicSizes = pageContent.sizes.map((s) => ({
    ...s,
    selected: s.size === activeSize,
  }));

  let imageScale = 1;
  if (activeSize === "200") imageScale = 0.85;
  if (activeSize === "1") imageScale = 1.2;

  return (
    <div className="relative w-full max-h-screen sm:max-h-900px h-[100dvh] shadow-2xl select-none overflow-hidden">
      <IceCubes {...iceCubesProps} />
      <NavBar
        logo={pageContent.nav.logo}
        navItems={pageContent.nav.items}
        cartItemCount={pageContent.nav.cartCount}
        textColor="white"
        themeColor={theme.mainBgColor} // Pass theme color to NavBar
        buttonTextColor={theme.buttonTextColor} // Pass button text color to NavBar
      />
      <div 
        className="max-h-screen sm:max-h-900px h-[100dvh] overflow-hidden w-full relative"
        style={{
          backgroundImage: "url('/assets/images/spice_pattern.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "400px",
          animation: "scroll-background 60s linear infinite",
        }}
      >
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

              {/* ProductLogo always fixed as "MEAL FIT" and always white */}
              <ProductLogo
                isMobile={isMobile}
                text="MEAL FIT"
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
                  imageScale={imageScale}
                />
              </div>

              <SizeSelector
                sizes={dynamicSizes}
                selectedColor={theme.mainBgColor}
                unselectedColor="rgba(0,0,0,0.45)"
                textColor="white"
                selectedTextColor="rgba(255,255,255,0.9)"
                onSelect={setActiveSize}
              />

              <ProductInfo
                title={productTitle}
                juiceData={juiceData}
                buttonText={t("orderNow")}
                buttonBgColor={theme.buttonBgColor}
                buttonTextColor={theme.buttonTextColor}
                onProductClick={() => {
                  const slugMap: Record<string, string> = {
                    "Marinated Chicken": "marinated-chicken",
                    "Premium Beef": "prime-beef",
                    "BBQ Ribs": "bbq-ribs",
                    "Citrus Salmon": "orange-salmon",
                  };
                  const slug = slugMap[productTitle] || "marinated-chicken";
                  router.push(`/product/${slug}`);
                }}
              />

              <ScrollDownButton
                firstLine={t("scroll")}
                secondLine={t("down")}
                textColor="white"
                isMobile={isMobile}
                themeColor={theme.mainBgColor}
              />
            </div>
          </div>
        <style jsx global>{`
          @keyframes scroll-background {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: -400px -400px;
            }
          }
        `}</style>
    </div>
  );
}
