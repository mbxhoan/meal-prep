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
      className="min-h-screen"
      style={{
        backgroundImage: "url('/assets/images/spice_pattern.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "400px",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
        {/* Back button */}
        <div className="pt-6 px-6 md:px-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <FaArrowLeft size={12} />
            {t("backToHome")}
          </Link>
        </div>

        {/* White content card */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 md:px-12 py-12 text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">
                {t("menu.title")}
              </h1>
              <p className="text-base text-white/80 max-w-xl mx-auto">
                {t("menu.subtitle")}
              </p>
            </div>

            {/* Category filters */}
            <nav className="flex flex-wrap justify-center gap-3 px-6 py-8 border-b border-gray-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent text-white shadow-md"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  {cat === "all" ? t("allCategories") : t(`nav.${cat}`)}
                </button>
              ))}
            </nav>

            {/* Product Grid */}
            <section className="px-6 md:px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginated.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.03] overflow-hidden"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-white p-4 flex items-center justify-center">
                      <Image
                        src={product.image}
                        alt={t(`products.${product.nameKey}`)}
                        width={200}
                        height={200}
                        className="object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_5px_10px_rgba(0,0,0,0.15)]"
                      />
                      <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {product.nutrition.calories} {t("kcal")}
                      </span>
                    </div>
                    <div className="p-4 pt-2">
                      <h3 className="font-bold text-sm md:text-base mb-1 text-gray-800 group-hover:text-orange-500 transition-colors">
                        {t(`products.${product.nameKey}`)}
                      </h3>
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        {t(`nav.${product.category}`)}
                      </span>
                      <div className="mt-3 text-xs text-orange-500 font-semibold">
                        {t("menu.viewDetails")} →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pb-10 pt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-200 transition-all"
                >
                  {t("prev")}
                </button>
                <span className="text-gray-500 text-sm">
                  {t("page")} {currentPage} {t("of")} {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-200 transition-all"
                >
                  {t("next")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
