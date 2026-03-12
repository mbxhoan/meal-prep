"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage, Footer } from "@/shared";
import { products, categories, type Category } from "@/config/products";
import { FaArrowLeft } from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

export default function MenuPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategory = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

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
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
          >
            <FaArrowLeft size={12} />
            {t("backToHome")}
          </Link>
        </div>

        {/* Header */}
        <header className="text-center pt-12 pb-8 px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            {t("menu.title")}
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            {t("menu.subtitle")}
          </p>
        </header>

        {/* Category filters */}
        <nav className="flex flex-wrap justify-center gap-3 px-6 pb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent text-white"
                  : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat === "all" ? t("allCategories") : t(`nav.${cat}`)}
            </button>
          ))}
        </nav>

        {/* Product Grid */}
        <section className="max-w-6xl mx-auto px-6 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginated.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/25 transition-all duration-300 hover:transform hover:scale-[1.03] overflow-hidden"
              >
                <div className="relative aspect-square bg-gradient-to-br from-white/5 to-white/0 p-4 flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={t(`products.${product.nameKey}`)}
                    width={200}
                    height={200}
                    className="object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)]"
                  />
                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                    {product.nutrition.calories} {t("kcal")}
                  </span>
                </div>
                <div className="p-4 pt-2">
                  <h3 className="font-bold text-sm md:text-base mb-1 text-white group-hover:text-orange-300 transition-colors">
                    {t(`products.${product.nameKey}`)}
                  </h3>
                  <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                    {t(`nav.${product.category}`)}
                  </span>
                  <div className="mt-3 text-xs text-orange-400 font-semibold">
                    {t("menu.viewDetails")} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pb-12 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 border border-white/20 disabled:opacity-30 hover:bg-white/20 transition-all"
            >
              {t("prev")}
            </button>
            <span className="text-white/60 text-sm">
              {t("page")} {currentPage} {t("of")} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 border border-white/20 disabled:opacity-30 hover:bg-white/20 transition-all"
            >
              {t("next")}
            </button>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
