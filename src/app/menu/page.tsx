import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { Footer } from "@/shared";
import { formatCurrency } from "@/lib/admin/format";
import { getMenuProducts } from "@/lib/admin/service";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [products, resolvedSearchParams] = await Promise.all([
    getMenuProducts(),
    searchParams,
  ]);
  const requestedCategory = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;
  const categories = Array.from(
    new Set(products.map((product) => product.categoryName)),
  );
  const filteredProducts = requestedCategory
    ? products.filter((product) => product.categoryName === requestedCategory)
    : products;

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
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <FaArrowLeft size={12} />
            Về trang chủ
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 md:px-12 py-12 text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">
                Thực Đơn
              </h1>
              <p className="text-base text-white/80 max-w-xl mx-auto">
                Danh sách này đọc từ cùng data layer với admin. Khi bạn đổi ảnh đại
                diện, mô tả hoặc giá mặc định trong dashboard, storefront sẽ phản ánh
                ngay.
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-3 px-6 py-8 border-b border-gray-100">
              <Link
                href="/menu"
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ${
                  !requestedCategory
                    ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent text-white shadow-md"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                Tất cả
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/menu?category=${encodeURIComponent(category)}`}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ${
                    requestedCategory === category
                      ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent text-white shadow-md"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </nav>

            <section className="px-6 md:px-8 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredProducts.map((product) => {
                  const defaultVariant =
                    product.variants.find((variant) => variant.isDefault) ??
                    product.variants[0];

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="group bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-white p-4 flex items-center justify-center">
                        <Image
                          src={product.mainImageUrl}
                          alt={product.name}
                          width={220}
                          height={220}
                          className="object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_5px_10px_rgba(0,0,0,0.15)]"
                        />
                        <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {defaultVariant
                            ? formatCurrency(defaultVariant.price)
                            : "Sắp có"}
                        </span>
                      </div>
                      <div className="p-4 pt-2">
                        <h3 className="font-bold text-sm md:text-base mb-1 text-gray-800 group-hover:text-orange-500 transition-colors">
                          {product.name}
                        </h3>
                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                          {product.categoryName}
                        </span>
                        <p className="mt-2 min-h-[42px] text-xs leading-5 text-gray-500">
                          {product.shortDescription}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-400">
                            {product.variants.length} lựa chọn
                          </span>
                          <span className="text-orange-500">Xem chi tiết →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
