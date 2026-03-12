"use client";
import Link from "next/link";
import { useLanguage } from "@/shared";
import { Footer } from "@/shared";
import { FaLeaf, FaHeart, FaRecycle, FaClock, FaArrowLeft } from "react-icons/fa";

const valueIcons = [FaLeaf, FaHeart, FaRecycle, FaClock];
const valueColors = ["#4CAF50", "#E91E63", "#009688", "#FF9800"];

export default function AboutPage() {
  const { t } = useLanguage();
  const values = t("about.values") as unknown as { title: string; desc: string }[];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: "url('/assets/images/spice_pattern.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "400px",
      }}
    >
      {/* Dark overlay */}
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

        {/* Hero */}
        <header className="text-center py-16 px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            {t("about.title")}
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto">
            {t("about.subtitle")}
          </p>
        </header>

        {/* Story */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10">
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              {t("about.story")}
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            {t("about.mission")}
          </h2>
          <p className="text-lg text-white/70 text-center max-w-3xl mx-auto leading-relaxed">
            {t("about.missionText")}
          </p>
        </section>

        {/* Values */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.isArray(values) && values.map((val, i) => {
              const Icon = valueIcons[i];
              return (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${valueColors[i]}20` }}
                  >
                    <Icon size={24} color={valueColors[i]} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{val.title}</h3>
                  <p className="text-white/60 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-16 px-6">
          <Link
            href="/menu"
            className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full hover:opacity-90 transition-opacity text-lg"
          >
            {t("menu.title")} →
          </Link>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
