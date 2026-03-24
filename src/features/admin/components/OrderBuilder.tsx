"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderAction } from "@/lib/admin/actions";
import { formatCurrency, roundCurrency } from "@/lib/admin/format";
import type { MenuProduct, MenuVariant, OrderStatus, SalesChannel } from "@/lib/admin/types";

const initialState = {
  status: "idle",
  message: "",
  mode: "demo",
} as const;

type BuilderLine = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
};

function buildVariantIndex(products: MenuProduct[]) {
  const entries: Array<{
    product: MenuProduct;
    variant: MenuVariant;
  }> = [];

  for (const product of products) {
    for (const variant of product.variants) {
      entries.push({ product, variant });
    }
  }

  return entries;
}

export function OrderBuilder({ products }: { products: MenuProduct[] }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("website");
  const [status, setStatus] = useState<OrderStatus>("draft");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [shippingFee, setShippingFee] = useState("25000");
  const [otherFee, setOtherFee] = useState("0");
  const [note, setNote] = useState("");

  const variantEntries = useMemo(() => buildVariantIndex(products), [products]);
  const fallbackVariant = variantEntries[0]?.variant;
  const [lines, setLines] = useState<BuilderLine[]>(() =>
    fallbackVariant
      ? [
          {
            id: crypto.randomUUID(),
            variantId: fallbackVariant.id,
            quantity: 1,
            unitPrice: fallbackVariant.price,
          },
        ]
      : [],
  );
  const [state, action, pending] = useActionState(createOrderAction, initialState);

  const lineSummaries = lines.map((line) => {
    const entry = variantEntries.find((variantEntry) => variantEntry.variant.id === line.variantId);
    const unitCogs = entry?.variant.totalCost ?? 0;
    const lineRevenue = roundCurrency(line.quantity * line.unitPrice);
    const lineCogs = roundCurrency(line.quantity * unitCogs);

    return {
      ...line,
      productName: entry?.product.name ?? "Chọn món",
      variantLabel: entry?.variant.label ?? "",
      unitCogs,
      lineRevenue,
      lineCogs,
      lineProfit: roundCurrency(lineRevenue - lineCogs),
    };
  });

  const subtotal = lineSummaries.reduce((sum, line) => sum + line.lineRevenue, 0);
  const totalCogs = lineSummaries.reduce((sum, line) => sum + line.lineCogs, 0);
  const totalRevenue = roundCurrency(
    subtotal - Number(discountAmount || 0) + Number(shippingFee || 0) + Number(otherFee || 0),
  );
  const grossProfit = roundCurrency(totalRevenue - totalCogs);
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

  return (
    <form action={action} className="space-y-6">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
        customerName,
        customerPhone,
        customerAddress,
        salesChannel,
        status,
        discountAmount: Number(discountAmount || 0),
        shippingFee: Number(shippingFee || 0),
        otherFee: Number(otherFee || 0),
          note,
          items: lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        })}
      />

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Tên khách
                </span>
                <input
                  required
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Nguyen Van A"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Số điện thoại
                </span>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="090..."
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Địa chỉ giao hàng
                </span>
                <input
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Số nhà, đường, phường/xã..."
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Kênh bán
                </span>
                <select
                  value={salesChannel}
                  onChange={(event) => setSalesChannel(event.target.value as SalesChannel)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="website">Website</option>
                  <option value="facebook">Facebook</option>
                  <option value="zalo">Zalo</option>
                  <option value="store">Cửa hàng</option>
                  <option value="grab">Grab / app</option>
                  <option value="manual">Manual</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Trạng thái
                </span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as OrderStatus)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ghi chú
              </span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Ví dụ: giao trước 12h, không hành..."
              />
            </label>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Order lines
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Menu và giá bán
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!fallbackVariant) {
                    return;
                  }

                  setLines((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      variantId: fallbackVariant.id,
                      quantity: 1,
                      unitPrice: fallbackVariant.price,
                    },
                  ]);
                }}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Thêm món
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {lines.map((line, index) => {
                const summary = lineSummaries[index];

                return (
                  <div
                    key={line.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.6fr_0.5fr_0.8fr_auto]">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Menu item
                        </span>
                        <select
                          value={line.variantId}
                          onChange={(event) => {
                            const selectedVariant = variantEntries.find(
                              (entry) => entry.variant.id === event.target.value,
                            )?.variant;

                            setLines((current) =>
                              current.map((entry) =>
                                entry.id === line.id
                                  ? {
                                      ...entry,
                                      variantId: event.target.value,
                                      unitPrice:
                                        selectedVariant?.price ?? entry.unitPrice,
                                    }
                                  : entry,
                              ),
                            );
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                          {variantEntries.map((entry) => (
                            <option key={entry.variant.id} value={entry.variant.id}>
                              {entry.product.name} · {entry.variant.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Qty
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((entry) =>
                                entry.id === line.id
                                  ? {
                                      ...entry,
                                      quantity: Math.max(
                                        1,
                                        Number(event.target.value || 1),
                                      ),
                                    }
                                  : entry,
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Giá bán
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={line.unitPrice}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((entry) =>
                                entry.id === line.id
                                  ? {
                                      ...entry,
                                      unitPrice: Number(event.target.value || 0),
                                    }
                                  : entry,
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setLines((current) =>
                            current.length > 1
                              ? current.filter((entry) => entry.id !== line.id)
                              : current,
                          )
                        }
                        className="mt-6 inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Xoá
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 md:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Món
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {summary.productName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Unit COGS
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {formatCurrency(summary.unitCogs)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Revenue
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {formatCurrency(summary.lineRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Profit
                        </p>
                        <p className="mt-1 font-medium text-emerald-700">
                          {formatCurrency(summary.lineProfit)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[#18352d]/10 bg-[#18352d] p-6 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)]">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Auto calculation
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Doanh thu và gross profit</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/65">Tạm tính món</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/65">COGS</span>
                <span>{formatCurrency(totalCogs)}</span>
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">
                    Discount
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">
                    Shipping
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(event) => setShippingFee(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">
                    Other fee
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={otherFee}
                    onChange={(event) => setOtherFee(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Total revenue</span>
                  <span className="font-medium text-white">
                    {formatCurrency(totalRevenue)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-white/70">
                  <span>Gross profit</span>
                  <span className="font-medium text-emerald-300">
                    {formatCurrency(grossProfit)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-white/70">
                  <span>Margin</span>
                  <span className="font-medium text-white">
                    {(grossMargin * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={pending || lines.length === 0}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-[#18352d] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Đang tạo đơn..." : "Lưu đơn và tính tự động"}
              </button>
            </div>
          </section>

          {state.status !== "idle" ? (
            <section
              className={`rounded-[28px] border p-5 text-sm leading-7 ${
                state.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {state.message}
            </section>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
