"use client";
import Link from "next/link";
import { useLanguage, Footer } from "@/shared";
import { FaLeaf, FaHeart, FaRecycle, FaClock, FaArrowLeft } from "react-icons/fa";

const valueIcons = [FaLeaf, FaHeart, FaRecycle, FaClock];
const valueColors = ["#4CAF50", "#E91E63", "#009688", "#FF9800"];

export default function AboutPage() {
  const { t } = useLanguage();
  const values = t("about.values") as unknown as { title: string; desc: string }[];

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
      {/* Light overlay instead of dark */}
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
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 md:px-12 py-14 text-center">
              <h1 className="text-xl md:text-[20px] font-bold text-white mb-3">
                {t("about.title")}
              </h1>
              <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
                {t("about.subtitle")}
              </p>
            </div>

            {/* Story */}
            <section className="px-8 md:px-12 py-10 border-b border-gray-100">
              <p className="text-base text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t("about.story")}
              </p>
            </section>

            {/* Mission */}
            <section className="px-8 md:px-12 py-10 border-b border-gray-100">
              <h2 className="text-lg md:text-[20px] font-bold text-gray-800 mb-4 text-center">
                {t("about.mission")}
              </h2>
              <p className="text-sm text-gray-500 text-center max-w-3xl mx-auto leading-relaxed">
                {t("about.missionText")}
              </p>
            </section>

            {/* Values */}
            <section className="px-8 md:px-12 py-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.isArray(values) && values.map((val, i) => {
                  const Icon = valueIcons[i];
                  return (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02]"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${valueColors[i]}15` }}
                      >
                        <Icon size={22} color={valueColors[i]} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{val.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{val.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CTA */}
            <section className="text-center pb-12 px-8">
              <Link
                href="/menu"
                className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full hover:opacity-90 transition-opacity text-base shadow-lg shadow-orange-500/20"
              >
                {t("menu.viewDetails")} →
              </Link>
            </section>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
