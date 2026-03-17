import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { PageHeader, StatusPill } from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { getMenuProducts } from "@/lib/admin/service";

export default async function AdminMenuPage() {
  const products = await getMenuProducts();

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Menu"
        title="Ảnh đại diện, giá bán và cost profile"
        description="Trang này tập trung vào chỉnh thực đơn. Mỗi món có ảnh đại diện, thông tin hiển thị trên trang menu và các variant kèm cost profile để order builder dùng khi tính lợi nhuận."
      />

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {products.map((product) => {
          const defaultVariant =
            product.variants.find((variant) => variant.isDefault) ?? product.variants[0];

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
            >
              <div className="relative bg-[radial-gradient(circle_at_top_left,_rgba(24,53,45,0.14),_transparent_46%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-6 pb-6 pt-8">
                <div className="absolute right-5 top-5">
                  <StatusPill
                    label={product.isPublished ? "Published" : "Draft"}
                    tone={product.isPublished ? "success" : "warning"}
                  />
                </div>
                <div className="flex gap-5">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[26px] border border-slate-100 bg-white">
                    <Image
                      src={product.mainImageUrl}
                      alt={product.name}
                      fill
                      sizes="112px"
                      className="object-contain p-3"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#51724f]">
                      {product.categoryName}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {product.name}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {product.shortDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                {defaultVariant ? (
                  <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Default variant
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {defaultVariant.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Giá bán / COGS
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {formatCurrency(defaultVariant.price)} /{" "}
                        {formatCurrency(defaultVariant.totalCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Margin
                      </p>
                      <p className="mt-2 font-medium text-emerald-700">
                        {formatPercent(defaultVariant.grossMargin)}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{product.variants.length} variants</span>
                  <span>Updated {formatDate(product.updatedAt)}</span>
                </div>

                <Link
                  href={`/admin/menu/${product.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Edit thực đơn
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
