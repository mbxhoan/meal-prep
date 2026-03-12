"use client";
import Link from "next/link";
import { useLanguage } from "@/shared";
import { FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

export default function Footer() {
  const { t, language } = useLanguage();
  
  return (
    <footer className="relative z-10 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-3">MEAL PREP</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              {language === "vi"
                ? "Thực phẩm chế biến sẵn cao cấp, tẩm ướp hoàn hảo cho lối sống năng động của bạn."
                : "Premium pre-marinated meals, perfectly seasoned for your active lifestyle."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">
              {language === "vi" ? "Liên kết nhanh" : "Quick Links"}
            </h4>
            <div className="space-y-2">
              <Link href="/" className="block text-white/50 hover:text-white transition-colors text-sm">{language === "vi" ? "Trang chủ" : "Home"}</Link>
              <Link href="/menu" className="block text-white/50 hover:text-white transition-colors text-sm">{t("nav.menu")}</Link>
              <Link href="/about" className="block text-white/50 hover:text-white transition-colors text-sm">{t("nav.about")}</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">
              {language === "vi" ? "Liên hệ" : "Contact"}
            </h4>
            <div className="space-y-3 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <FaPhone size={12} className="text-orange-400" />
                <span>+84 123 456 789</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope size={12} className="text-orange-400" />
                <span>hello@mealprep.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt size={12} className="text-orange-400" />
                <span>{language === "vi" ? "TP. Hồ Chí Minh, Việt Nam" : "Ho Chi Minh City, Vietnam"}</span>
              </div>
              <div className="flex gap-3 pt-2">
                <span className="text-white/40 hover:text-orange-400 transition-colors cursor-pointer"><FaFacebook size={18} /></span>
                <span className="text-white/40 hover:text-orange-400 transition-colors cursor-pointer"><FaInstagram size={18} /></span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/30 text-xs">
          © 2024 Meal Prep. {language === "vi" ? "Mọi quyền được bảo lưu." : "All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
