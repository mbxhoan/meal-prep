"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { formatCurrency, roundCurrency } from "@/lib/admin/format";
import {
  GuardrailChecklist,
  GuidedWorkflowCard,
} from "@/features/admin/components";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";
import type {
  DeliveryStatus,
  MenuProduct,
  MenuVariant,
  OrderType,
  SalesChannel,
} from "@/lib/admin/types";
import { createSalesOrderAction } from "@/lib/sales/actions";
import type {
  SalesOrderCustomerOption,
  SalesOrderEmployeeOption,
} from "@/lib/sales/types";

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
  const entries: Array<{ product: MenuProduct; variant: MenuVariant }> = [];

  for (const product of products) {
    for (const variant of product.variants) {
      entries.push({ product, variant });
    }
  }

  return entries;
}

function formatCustomerLabel(customer: SalesOrderCustomerOption) {
  return [customer.code, customer.name].filter(Boolean).join(" · ");
}

function formatEmployeeLabel(employee: SalesOrderEmployeeOption) {
  return [employee.employeeCode, employee.fullName].filter(Boolean).join(" · ");
}

export function OrderBuilder({
  products,
  customers,
  employees,
  defaultEmployeeId,
}: {
  products: MenuProduct[];
  customers: SalesOrderCustomerOption[];
  employees: SalesOrderEmployeeOption[];
  defaultEmployeeId: string | null;
}) {
  const variantEntries = useMemo(() => buildVariantIndex(products), [products]);
  const fallbackVariant = variantEntries[0]?.variant ?? null;
  const defaultCustomerId = customers[0]?.id ?? "";
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId ?? employees[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("order");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("pending");
  const [shipperName, setShipperName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [shippingFee, setShippingFee] = useState("25000");
  const [paidAmount, setPaidAmount] = useState("0");
  const [note, setNote] = useState("");

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
  const [state, action, pending] = useActionState(createSalesOrderAction, initialState);

  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? null;

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    setCustomerName(selectedCustomer.name);
    setCustomerPhone(selectedCustomer.phone ?? "");
    setCustomerAddress(selectedCustomer.address ?? "");
  }, [selectedCustomer]);

  useEffect(() => {
    if (employeeId.length > 0) {
      return;
    }

    setEmployeeId(defaultEmployeeId ?? employees[0]?.id ?? "");
  }, [defaultEmployeeId, employeeId, employees]);

  const lineSummaries = lines.map((line) => {
    const entry = variantEntries.find((variantEntry) => variantEntry.variant.id === line.variantId);
    const unitCost = entry?.variant.totalCost ?? 0;
    const lineRevenue = roundCurrency(line.quantity * line.unitPrice);
    const lineCost = roundCurrency(line.quantity * unitCost);

    return {
      ...line,
      productName: entry?.product.name ?? "Chọn món",
      variantLabel: entry?.variant.label ?? "",
      weightInGrams: entry?.variant.weightInGrams ?? null,
      unitCost,
      lineRevenue,
      lineCost,
      lineProfit: roundCurrency(lineRevenue - lineCost),
    };
  });

  const subtotalBeforeDiscount = roundCurrency(
    lineSummaries.reduce((sum, line) => sum + line.lineRevenue, 0),
  );
  const discountPercentValue = Math.max(Number(discountPercent || 0), 0);
  const discountAmount = roundCurrency(subtotalBeforeDiscount * discountPercentValue / 100);
  const shippingFeeValue = Math.max(Number(shippingFee || 0), 0);
  const totalWithShip = roundCurrency(subtotalBeforeDiscount + shippingFeeValue);
  const totalAfterDiscount = roundCurrency(
    Math.max(subtotalBeforeDiscount - discountAmount, 0),
  );
  const totalPayable = roundCurrency(
    Math.max(totalAfterDiscount + shippingFeeValue, 0),
  );
  const paidAmountValue = Math.max(Number(paidAmount || 0), 0);
  const balanceDue = roundCurrency(Math.max(totalPayable - paidAmountValue, 0));

  return (
    <form action={action} className="space-y-5">
      <GuidedWorkflowCard
        eyebrow="Quy trình"
        title="Tạo đơn theo kiểu sheet"
        description="Chọn khách, thêm món, nhập giảm giá và phí ship rồi lưu để ra bill."
        steps={[
          "Chọn khách và nhân viên.",
          "Thêm món, số lượng và giá bán.",
          "Nhập giảm giá, phí ship và đã thanh toán.",
          "Lưu để giữ giá và mở bill ngay.",
        ]}
      />

      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          customerId: customerId || null,
          customerName,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          employeeId: employeeId || null,
          salesChannel: "manual" satisfies SalesChannel,
          orderType,
          deliveryStatus,
          shipperName,
          discountPercent: discountPercentValue,
          discountAmount,
          shippingFee: shippingFeeValue,
          paidAmount: paidAmountValue,
          otherFee: 0,
          note,
          items: lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        })}
      />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Khách hàng
                </span>
                <select
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="">Chọn khách hàng</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {formatCustomerLabel(customer)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Tên khách
                </span>
                <input
                  required
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
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
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Địa chỉ
                </span>
                <input
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Số nhà, đường, phường/xã..."
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Nhân viên
                </span>
                <select
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {formatEmployeeLabel(employee)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Loại đơn hàng
                </span>
                <select
                  value={orderType}
                  onChange={(event) => setOrderType(event.target.value as OrderType)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="order">Order</option>
                  <option value="ready_made">Hàng sẵn</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Trạng thái giao hàng
                </span>
                <select
                  value={deliveryStatus}
                  onChange={(event) =>
                    setDeliveryStatus(event.target.value as DeliveryStatus)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="pending">Chưa giao hàng</option>
                  <option value="delivered">Đã giao hàng</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Shipper
                </span>
                <input
                  value={shipperName}
                  onChange={(event) => setShipperName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Tên shipper hoặc đơn vị giao hàng"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
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

          <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Chi tiết đơn
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  Dòng món
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
                title="Thêm dòng"
                aria-label="Thêm dòng"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <FaPlus className="text-sm" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Món</th>
                    <th className="px-3 py-2 font-medium">Khối lượng</th>
                    <th className="px-3 py-2 font-medium">SL</th>
                    <th className="px-3 py-2 font-medium">Đơn giá</th>
                    <th className="px-3 py-2 font-medium">Thành tiền</th>
                    <th className="px-3 py-2 font-medium">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lines.map((line, index) => {
                    const summary = lineSummaries[index];

                    return (
                      <tr key={line.id} className="align-top">
                        <td className="px-3 py-3">
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
                                        unitPrice: selectedVariant?.price ?? entry.unitPrice,
                                      }
                                    : entry,
                                ),
                              );
                            }}
                            className="w-full min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none"
                          >
                            {variantEntries.map((entry) => (
                              <option key={entry.variant.id} value={entry.variant.id}>
                                {entry.product.name} · {entry.variant.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-[12px] text-slate-500">
                            {summary.productName}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {summary.weightInGrams == null
                            ? summary.variantLabel || "—"
                            : `${summary.weightInGrams}g`}
                        </td>
                        <td className="px-3 py-3">
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
                            className="w-20 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none"
                          />
                        </td>
                        <td className="px-3 py-3">
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
                            className="w-28 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {formatCurrency(summary.lineRevenue)}
                          <div className="mt-1 text-[12px] text-slate-500">
                            Vốn {formatCurrency(summary.lineCost)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setLines((current) =>
                                current.length > 1
                                  ? current.filter((entry) => entry.id !== line.id)
                                  : current,
                              )
                            }
                            title="Xóa dòng"
                            aria-label="Xóa dòng"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Tổng dòng
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatCurrency(subtotalBeforeDiscount)}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Số dòng
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {lines.length}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Tiền thu
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatCurrency(paidAmountValue)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-[#18352d]/10 bg-[#18352d] p-4 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)]">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Tổng hợp
            </p>
            <h2 className="mt-2 text-lg font-semibold">Tính tiền</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/65">Tổng CHƯA SHIP</span>
                <span>{formatCurrency(subtotalBeforeDiscount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/65">Giảm giá {discountPercentValue}%</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/65">Tổng CÓ SHIP</span>
                <span>{formatCurrency(totalWithShip)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/65">Sau giảm</span>
                <span>{formatCurrency(totalAfterDiscount)}</span>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/6 px-3 py-3">
                <div className="flex items-center justify-between gap-4 text-sm text-white/80">
                  <span>TỔNG THANH TOÁN</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(totalPayable)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(paidAmountValue)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Còn phải thu</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">
                  Giảm giá (%)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">
                  Phí ship
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={shippingFee}
                  onChange={(event) => setShippingFee(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">
                  Đã thanh toán
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={paidAmount}
                  onChange={(event) => setPaidAmount(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            </div>
          </section>

          <GuardrailChecklist
            title="Trước khi lưu"
            note="Đơn mới sẽ giữ nguyên giá khi bấm Lưu."
            items={[
              "Khách, nhân viên và shipper đã đúng.",
              "Món, số lượng và giá đã rà.",
              "Giảm giá, phí ship và tiền thu đã đủ.",
            ]}
          />

          <div className="grid gap-2">
            <button
              type="submit"
              disabled={pending || lines.length === 0}
              className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "Lưu đơn và ra bill"}
            </button>
            {state.status !== "idle" ? (
              <p
                className={`rounded-2xl px-4 py-3 text-sm ${
                  state.status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {state.message}
              </p>
            ) : null}
            {ADMIN_SIMPLE_MODE ? (
              <p className="text-[12px] leading-5 text-slate-500">
                Giao diện đã được rút gọn để giống sheet. Các phần kho và công thức đang ẩn.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </form>
  );
}
