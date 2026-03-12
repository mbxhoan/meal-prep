"use client";
import { use, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage, Footer } from "@/shared";
import { products } from "@/config/products";
import { FaArrowLeft, FaCheckCircle, FaShoppingCart } from "react-icons/fa";

const nutritionColors = [
  { label: "Protein", fill: "#f9a8a8" },
  { label: "Carbs", fill: "#6ee7b7" },
  { label: "Fat", fill: "#93c5fd" },
  { label: "Fiber", fill: "#fbbf24" },
];

const weightOptions = [
  { size: "200", unit: "G", multiplier: 2 },
  { size: "500", unit: "G", multiplier: 5 },
  { size: "1", unit: "KG", multiplier: 10 },
];

// Price per weight (placeholder)
const priceMap: Record<string, string> = {
  "200": "Đang cập nhật",
  "500": "Đang cập nhật",
  "1": "Đang cập nhật",
  custom: "Đang cập nhật",
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const product = products.find((p) => p.slug === slug);
  const [activeWeight, setActiveWeight] = useState("500");
  const [customWeight, setCustomWeight] = useState<string>("");

  // Calculate nutrition based on active weight (must be before early return)
  const multiplier = useMemo(() => {
    if (customWeight && parseFloat(customWeight) > 0) {
      return parseFloat(customWeight) / 100;
    }
    const opt = weightOptions.find((w) => w.size === activeWeight);
    return opt ? opt.multiplier : 5;
  }, [activeWeight, customWeight]);

  const baseNutrition = product?.nutrition ?? { calories: 0, protein: "0g", carbs: "0g", fat: "0g", fiber: "0g" };
  const scaledNutrition = {
    calories: Math.round(baseNutrition.calories * multiplier),
    protein: `${(parseFloat(baseNutrition.protein) * multiplier).toFixed(1)}g`,
    carbs: `${(parseFloat(baseNutrition.carbs) * multiplier).toFixed(1)}g`,
    fat: `${(parseFloat(baseNutrition.fat) * multiplier).toFixed(1)}g`,
    fiber: `${(parseFloat(baseNutrition.fiber) * multiplier).toFixed(1)}g`,
  };

  const nutritionValues = [
    scaledNutrition.protein,
    scaledNutrition.carbs,
    scaledNutrition.fat,
    scaledNutrition.fiber,
  ];

  const maxGrams = 50 * multiplier;
  const fillPercentages = nutritionValues.map((v) => {
    const num = parseFloat(v);
    return Math.min((num / maxGrams) * 100, 100);
  });

  const currentPrice = customWeight && parseFloat(customWeight) > 0
    ? priceMap.custom
    : priceMap[activeWeight] || "Đang cập nhật";

  const displayWeight = customWeight && parseFloat(customWeight) > 0
    ? `${customWeight}g`
    : activeWeight === "1" ? "1 KG" : `${activeWeight}G`;

  if (!product) {
    return (
      <div
        className="min-h-screen text-white flex items-center justify-center"
        style={{
          backgroundImage: "url('/assets/images/spice_pattern.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "400px",
        }}
      >
        <div className="min-h-screen flex items-center justify-center w-full" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <Link href="/menu" className="text-orange-400 hover:underline">{t("backToMenu")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: "url('/assets/images/spice_pattern.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "400px",
      }}
    >
      <div className="min-h-screen" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        {/* Back button */}
        <div className="pt-6 px-6 md:px-16">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
          >
            <FaArrowLeft size={12} />
            {t("backToMenu")}
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Product Image */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10 min-h-[300px] w-full">
                <div className="relative w-full max-w-[280px] aspect-square">
                  <Image
                    src={product.image}
                    alt={t(`products.${product.nameKey}`)}
                    fill
                    className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                    style={{ animation: "float-product 6s ease-in-out infinite" }}
                  />
                </div>
              </div>

              {/* Weight Selector */}
              <div className="w-full bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <p className="text-sm text-white/50 mb-3 font-medium">
                  {t("perServing")} — {displayWeight}
                </p>
                <div className="flex gap-3 mb-4">
                  {weightOptions.map((opt) => (
                    <button
                      key={opt.size}
                      onClick={() => {
                        setActiveWeight(opt.size);
                        setCustomWeight("");
                      }}
                      className={`flex-1 py-3 rounded-xl text-center font-bold transition-all duration-300 border ${
                        activeWeight === opt.size && !customWeight
                          ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent text-white"
                          : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-lg">{opt.size}</span>
                      <span className="text-xs ml-1">{opt.unit}</span>
                    </button>
                  ))}
                </div>

                {/* Custom weight input */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      value={customWeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || parseFloat(val) >= 0) {
                          setCustomWeight(val);
                        }
                      }}
                      placeholder={t("perServing")}
                      className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Info */}
            <div>
              {/* Title + Calorie badge */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  {t(`products.${product.nameKey}`)}
                </h1>
                <span className="shrink-0 bg-white/10 backdrop-blur-sm text-white font-bold px-4 py-2 rounded-2xl text-sm border border-white/10">
                  {scaledNutrition.calories} {t("kcal")}
                </span>
              </div>

              {/* Description */}
              <p className="text-white/60 leading-relaxed mb-6">
                {t(`descriptions.${product.nameKey}`)}
              </p>

              {/* Price */}
              <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-sm text-white/40 block mb-1">Giá / Price</span>
                <span className="text-lg font-bold text-orange-400 italic">
                  📦 {currentPrice}
                </span>
              </div>

              {/* Nutrition Info */}
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-1">{t("nutritionInfo")}</h2>
                <p className="text-xs text-white/40 mb-4">{displayWeight}</p>

                <div className="grid grid-cols-4 gap-3">
                  {nutritionColors.map((nc, i) => (
                    <div
                      key={nc.label}
                      className="relative bg-white/10 rounded-2xl overflow-hidden flex flex-col items-center pt-4 pb-3 min-h-[120px] border border-white/5"
                    >
                      <span className="text-[11px] md:text-xs font-semibold text-white/70 mb-auto">
                        {nc.label}
                      </span>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-b-2xl transition-all duration-700"
                        style={{
                          height: `${Math.max(fillPercentages[i], 15)}%`,
                          background: `linear-gradient(to top, ${nc.fill}, ${nc.fill}88)`,
                          opacity: 0.5,
                        }}
                      />
                      <span className="relative z-10 text-base md:text-lg font-bold mt-auto text-white">
                        {nutritionValues[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">{t("benefits")}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {product.benefits.map((bKey) => (
                    <div key={bKey} className="flex items-center gap-2 text-sm text-white/60">
                      <FaCheckCircle className="text-green-400 shrink-0" size={14} />
                      <span>{t(bKey)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20">
                <FaShoppingCart size={18} />
                {t("productDetail.addToCart")}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />

        <style jsx global>{`
          @keyframes float-product {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
