import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaCheckCircle, FaShoppingCart } from "react-icons/fa";
import { Footer } from "@/shared";
import { formatCurrency } from "@/lib/admin/format";
import { getMenuProductBySlug } from "@/lib/admin/service";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getMenuProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const lowestPrice = product.variants.reduce(
    (min, variant) => Math.min(min, variant.price),
    product.variants[0]?.price ?? 0,
  );

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
      <div
        className="min-h-screen"
        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
      >
        <div className="pt-6 px-6 md:px-16">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <FaArrowLeft size={12} />
            Quay lại thực đơn
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 flex flex-col items-center gap-6 border-r border-gray-100">
                <div className="flex items-center justify-center min-h-[280px] w-full">
                  <div className="relative w-full max-w-[260px] aspect-square">
                    <Image
                      src={product.mainImageUrl}
                      alt={product.name}
                      fill
                      className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                      style={{ animation: "float-product 6s ease-in-out infinite" }}
                    />
                  </div>
                </div>

                <div className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-400 mb-3 font-medium">
                    Chọn size đang mở bán
                  </p>
                  <div className="grid gap-3">
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">{variant.label}</p>
                            <p className="text-xs text-gray-400">
                              {variant.weightInGrams
                                ? `${variant.weightInGrams} g`
                                : "Kích thước linh hoạt"}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-orange-500">
                            {formatCurrency(variant.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                    {product.name}
                  </h1>
                  <span className="shrink-0 bg-orange-50 text-orange-600 font-bold px-4 py-2 rounded-2xl text-sm border border-orange-100">
                    {product.categoryName}
                  </span>
                </div>

                <p className="text-gray-500 leading-relaxed mb-5 text-sm">
                  {product.description}
                </p>

                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                  <span className="text-sm text-gray-400 block mb-1">Giá bán</span>
                  <span className="text-lg font-bold text-orange-500 italic">
                    📦 Từ {formatCurrency(lowestPrice)}
                  </span>
                </div>

                <div className="mb-5">
                  <h2 className="text-base font-bold text-gray-800 mb-3">
                    Các lựa chọn hiện có
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">{variant.label}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              {variant.weightInGrams
                                ? `${variant.weightInGrams} g / phần`
                                : "Kích thước linh hoạt"}
                            </p>
                          </div>
                          <span className="font-semibold text-orange-500">
                            {formatCurrency(variant.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 mb-3">
                    Điểm nổi bật
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Ảnh đại diện đồng bộ từ trang quản trị",
                      "Giá bán quản lý theo biến thể",
                      "Danh mục có thể đổi từ bảng điều khiển",
                      "Sẵn sàng cho theo dõi lợi nhuận",
                    ].map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2 text-sm text-gray-500"
                      >
                        <FaCheckCircle className="text-green-500 shrink-0" size={13} />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-base flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20">
                  <FaShoppingCart size={16} />
                  Liên hệ đặt món
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
