"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { FaEye, FaPlus, FaRotateLeft, FaTrash } from "react-icons/fa6";
import { formatCurrency, roundCurrency } from "@/lib/admin/format";
import {
  GuardrailChecklist,
  GuidedWorkflowCard,
} from "@/features/admin/components";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";
import type {
  MenuProduct,
  MenuVariant,
  OrderType,
  SalesChannel,
} from "@/lib/admin/types";
import {
  createSalesOrderAction,
  quickCreateCustomerAction,
  quickCreateEmployeeAction,
} from "@/lib/sales/actions";
import type {
  SalesOrderCustomerOption,
  SalesOrderEmployeeOption,
  SalesQuickEmployeeState,
  SalesQuickCustomerState,
} from "@/lib/sales/types";

const initialState = {
  status: "idle",
  message: "",
  mode: "demo",
} as const;

const initialQuickCustomerState: SalesQuickCustomerState = {
  status: "idle",
  message: "",
  mode: "demo",
  customer: null,
};

const initialQuickEmployeeState: SalesQuickEmployeeState = {
  status: "idle",
  message: "",
  mode: "demo",
  employee: null,
};

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
  const [customerOptions, setCustomerOptions] = useState(customers);
  const [employeeOptions, setEmployeeOptions] = useState(employees);
  const [customerId, setCustomerId] = useState(customerOptions[0]?.id ?? "__new__");
  const [employeeId, setEmployeeId] = useState(
    defaultEmployeeId ?? employeeOptions[0]?.id ?? "__new__",
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeeJobTitle, setEmployeeJobTitle] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("order");
  const deliveryStatus = "pending" as const;
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
  const [quickCustomerState, quickCustomerAction, quickCustomerPending] = useActionState(
    quickCreateCustomerAction,
    initialQuickCustomerState,
  );
  const [quickEmployeeState, quickEmployeeAction, quickEmployeePending] = useActionState(
    quickCreateEmployeeAction,
    initialQuickEmployeeState,
  );

  const selectedCustomer =
    customerId === "__new__"
      ? null
      : customerOptions.find((customer) => customer.id === customerId) ?? null;

  useEffect(() => {
    if (customerId === "__new__") {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      return;
    }

    if (!selectedCustomer) {
      return;
    }

    setCustomerName(selectedCustomer.name);
    setCustomerPhone(selectedCustomer.phone ?? "");
    setCustomerAddress(selectedCustomer.address ?? "");
  }, [customerId, selectedCustomer]);

  useEffect(() => {
    if (quickCustomerState.status !== "success" || !quickCustomerState.customer) {
      return;
    }

    const createdCustomer = quickCustomerState.customer;

    setCustomerOptions((current) => {
      const withoutDuplicate = current.filter(
        (customer) => customer.id !== createdCustomer.id,
      );

      return [createdCustomer, ...withoutDuplicate];
    });
    setCustomerId(createdCustomer.id);
    setCustomerName(createdCustomer.name);
    setCustomerPhone(createdCustomer.phone ?? "");
    setCustomerAddress(createdCustomer.address ?? "");
  }, [quickCustomerState.customer, quickCustomerState.status]);

  useEffect(() => {
    if (employeeId === "__new__") {
      setEmployeeName("");
      setEmployeePhone("");
      setEmployeeJobTitle("");
      return;
    }
  }, [employeeId]);

  useEffect(() => {
    if (quickEmployeeState.status !== "success" || !quickEmployeeState.employee) {
      return;
    }

    const createdEmployee = quickEmployeeState.employee;

    setEmployeeOptions((current) => {
      const withoutDuplicate = current.filter(
        (employee) => employee.id !== createdEmployee.id,
      );

      return [createdEmployee, ...withoutDuplicate];
    });
    setEmployeeId(createdEmployee.id);
    setEmployeeName(createdEmployee.fullName);
    setEmployeePhone(createdEmployee.phone ?? "");
    setEmployeeJobTitle(createdEmployee.jobTitle ?? "");
  }, [quickEmployeeState.employee, quickEmployeeState.status]);

  const lineSummaries = lines.map((line) => {
    const entry = variantEntries.find((variantEntry) => variantEntry.variant.id === line.variantId);
    const unitCost = entry?.variant.totalCost ?? 0;
    const lineRevenue = roundCurrency(line.quantity * line.unitPrice);
    const lineCost = roundCurrency(line.quantity * unitCost);

    return {
      ...line,
      productId: entry?.product.id ?? "",
      productName: entry?.product.name ?? "Chọn món",
      variantLabel: entry?.variant.label ?? "",
      weightInGrams: entry?.variant.weightInGrams ?? null,
      defaultUnitPrice: entry?.variant.price ?? line.unitPrice,
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
  const orderCustomerId = customerId === "__new__" ? null : customerId || null;
  const orderEmployeeId = employeeId === "__new__" ? null : employeeId || null;

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
          customerId: orderCustomerId,
          customerName,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          employeeId: orderEmployeeId,
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
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="block text-[13px] font-medium text-slate-700">
                    Khách hàng
                  </span>
                  {customerId === "__new__" ? (
                    <button
                      type="submit"
                      formAction={quickCustomerAction}
                      formNoValidate
                      disabled={
                        quickCustomerPending || customerName.trim().length === 0
                      }
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {quickCustomerPending ? "Đang lưu..." : "Lưu khách mới"}
                    </button>
                  ) : null}
                </div>
                <select
                  value={customerId}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setCustomerId(nextValue);

                    if (nextValue === "__new__") {
                      setCustomerName("");
                      setCustomerPhone("");
                      setCustomerAddress("");
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="__new__">+ Thêm khách mới</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {formatCustomerLabel(customer)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  Chọn khách có sẵn hoặc thêm nhanh khách mới ngay tại đây.
                </p>
                {quickCustomerState.status !== "idle" ? (
                  <p
                    className={`mt-2 rounded-2xl px-3 py-2 text-[12px] ${
                      quickCustomerState.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {quickCustomerState.message}
                  </p>
                ) : null}
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
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="block text-[13px] font-medium text-slate-700">
                    Nhân viên
                  </span>
                  {employeeId === "__new__" ? (
                    <button
                      type="submit"
                      formAction={quickEmployeeAction}
                      formNoValidate
                      disabled={
                        quickEmployeePending || employeeName.trim().length === 0
                      }
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {quickEmployeePending ? "Đang lưu..." : "Lưu nhân viên mới"}
                    </button>
                  ) : null}
                </div>
                <select
                  value={employeeId}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setEmployeeId(nextValue);

                    if (nextValue === "__new__") {
                      setEmployeeName("");
                      setEmployeePhone("");
                      setEmployeeJobTitle("");
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="__new__">+ Thêm nhân viên mới</option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {formatEmployeeLabel(employee)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  Chọn nhân viên có sẵn hoặc thêm nhanh nhân viên mới ngay tại đây.
                </p>
                {employeeId === "__new__" ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                        Tên nhân viên
                      </span>
                      <input
                        required
                        value={employeeName}
                        onChange={(event) => setEmployeeName(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        placeholder="Nguyễn Văn A"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                        Số điện thoại
                      </span>
                      <input
                        value={employeePhone}
                        onChange={(event) => setEmployeePhone(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        placeholder="090..."
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                        Chức danh
                      </span>
                      <input
                        value={employeeJobTitle}
                        onChange={(event) => setEmployeeJobTitle(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        placeholder="Bán hàng"
                      />
                    </label>
                    {quickEmployeeState.status !== "idle" ? (
                      <p
                        className={`md:col-span-2 rounded-2xl px-3 py-2 text-[12px] ${
                          quickEmployeeState.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {quickEmployeeState.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                    Chi tiết đơn
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      Dòng món
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setLines((current) =>
                          current.map((line) => {
                            const entry = variantEntries.find(
                              (variantEntry) => variantEntry.variant.id === line.variantId,
                            );

                            return {
                              ...line,
                              unitPrice: entry?.variant.price ?? line.unitPrice,
                            };
                          }),
                        );
                      }}
                      title="Về giá mặc định"
                      aria-label="Về giá mặc định"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                    >
                      <FaRotateLeft className="text-[11px]" />
                      <span>Giá mặc định</span>
                    </button>
                  </div>
                </div>
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
                          <div className="flex flex-col gap-2">
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
                            <button
                              type="button"
                              onClick={() =>
                                setLines((current) =>
                                  current.map((entry) =>
                                    entry.id === line.id
                                      ? {
                                          ...entry,
                                          unitPrice: summary.defaultUnitPrice,
                                        }
                                      : entry,
                                  ),
                                )
                              }
                              title="Về giá mặc định của món này"
                              aria-label="Về giá mặc định của món này"
                              className="inline-flex items-center gap-1 self-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                            >
                              <FaRotateLeft className="text-[10px]" />
                              <span>Mặc định</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {formatCurrency(summary.lineRevenue)}
                          <div className="mt-1 text-[12px] text-slate-500">
                            Vốn {formatCurrency(summary.lineCost)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={
                                summary.productId
                                  ? `/admin/menu/${summary.productId}`
                                  : "#"
                              }
                              target="_blank"
                              rel="noreferrer"
                              title="Xem món"
                              aria-label="Xem món"
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-slate-700 transition ${
                                summary.productId
                                  ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                  : "pointer-events-none border-slate-100 bg-slate-50/60 opacity-40"
                              }`}
                            >
                              <FaEye className="text-sm" />
                            </Link>
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
                          </div>
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
