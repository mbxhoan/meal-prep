"use client";
import Link from "next/link";
import { useLanguage } from "@/shared";
import { FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

export default function Footer() {
  const { t, language } = useLanguage();
  
  return (
    <footer className="relative z-10">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 md:px-12 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">MEAL PREP</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {language === "vi"
                    ? "Thực phẩm chế biến sẵn cao cấp, tẩm ướp hoàn hảo cho lối sống năng động của bạn."
                    : "Premium pre-marinated meals, perfectly seasoned for your active lifestyle."}
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                  {language === "vi" ? "Liên kết nhanh" : "Quick Links"}
                </h4>
                <div className="space-y-2">
                  <Link href="/" className="block text-gray-500 hover:text-orange-500 transition-colors text-sm">{language === "vi" ? "Trang chủ" : "Home"}</Link>
                  <Link href="/menu" className="block text-gray-500 hover:text-orange-500 transition-colors text-sm">{t("nav.menu")}</Link>
                  <Link href="/about" className="block text-gray-500 hover:text-orange-500 transition-colors text-sm">{t("nav.about")}</Link>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                  {language === "vi" ? "Liên hệ" : "Contact"}
                </h4>
                <div className="space-y-3 text-sm text-gray-500">
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
                    <span className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"><FaFacebook size={18} /></span>
                    <span className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"><FaInstagram size={18} /></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-8 pt-6 text-center text-gray-400 text-xs">
              © 2024 Meal Prep. {language === "vi" ? "Mọi quyền được bảo lưu." : "All rights reserved."}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
