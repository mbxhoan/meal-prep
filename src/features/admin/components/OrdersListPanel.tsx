"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FaArrowRight,
  FaPlus,
  FaFilter,
  FaRotateLeft,
  FaMagnifyingGlass,
  FaTableColumns,
} from "react-icons/fa6";
import { ExportExcelButton } from "@/features/admin/components/ExportExcelButton";
import {
  StatusPill,
  deliveryStatusTone,
  formatDeliveryStatusLabel,
  formatOrderTypeLabel,
  formatOrderStatusLabel,
  formatPaymentStatusLabel,
  orderTypeTone,
  paymentStatusTone,
} from "@/features/admin/components/StatusPill";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type { OrderRecord } from "@/lib/admin/types";

function sumPayments(order: OrderRecord) {
  return (order.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
}

type ColumnKey =
  | "order"
  | "customer"
  | "type"
  | "date"
  | "total"
  | "paid"
  | "delivery"
  | "payment"
  | "open";

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  order: true,
  customer: true,
  type: true,
  date: true,
  total: true,
  paid: true,
  delivery: true,
  payment: true,
  open: true,
};

export function OrdersListPanel({ orders }: { orders: OrderRecord[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderRecord["status"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "order" | "ready_made">("all");
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "pending" | "delivered">(
    "all",
  );
  const [paymentFilter, setPaymentFilter] = useState<"all" | OrderRecord["paymentStatus"]>(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(
    DEFAULT_COLUMNS,
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== "all" && (order.orderType ?? "order") !== typeFilter) {
        return false;
      }

      if (
        deliveryFilter !== "all" &&
        (order.deliveryStatus ?? "pending") !== deliveryFilter
      ) {
        return false;
      }

      if (
        paymentFilter !== "all" &&
        (order.paymentStatus ?? "unpaid") !== paymentFilter
      ) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const haystack = [
        order.orderNumber,
        order.customerName,
        order.customerPhone ?? "",
        order.customerAddress ?? "",
        order.shipperName ?? "",
        formatOrderStatusLabel(order.status),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [deliveryFilter, orders, paymentFilter, query, statusFilter, typeFilter]);

  const exportRows = filteredOrders.map((order) => ({
    đơn_hàng: order.orderNumber,
    khách_hàng: order.customerName,
    loại_đơn: formatOrderTypeLabel(order.orderType ?? "order"),
    ngày: formatDate(order.orderedAt),
    tổng_tiền: formatCurrency(order.totalAmount ?? order.totalRevenue),
    đã_thu: formatCurrency(sumPayments(order)),
    giao_hàng: formatDeliveryStatusLabel(order.deliveryStatus ?? "pending"),
    thanh_toán: formatPaymentStatusLabel(order.paymentStatus ?? "unpaid"),
    trạng_thái: formatOrderStatusLabel(order.status),
  }));

  const exportColumns = [
    { key: "đơn_hàng", label: "Đơn hàng" },
    { key: "khách_hàng", label: "Khách hàng" },
    { key: "loại_đơn", label: "Loại đơn" },
    { key: "ngày", label: "Ngày" },
    { key: "tổng_tiền", label: "Tổng tiền" },
    { key: "đã_thu", label: "Đã thu" },
    { key: "giao_hàng", label: "Giao hàng" },
    { key: "thanh_toán", label: "Thanh toán" },
    { key: "trạng_thái", label: "Trạng thái" },
  ];

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Đơn hàng
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Danh sách đơn</h2>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Tìm, lọc và ẩn/hiện cột theo kiểu bảng tính.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${filteredOrders.length} đơn`} tone="success" />
            <Link
              href="/admin/orders/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              <FaPlus className="text-[11px]" />
              <span>Tạo đơn</span>
            </Link>
            <ExportExcelButton
              filename={`don-hang-${new Date().toISOString().slice(0, 10)}`}
              sheetName="Đơn hàng"
              title="Xuất Excel đơn hàng"
              columns={exportColumns}
              rows={exportRows}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <FaMagnifyingGlass className="text-xs" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm đơn, khách, SĐT..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaFilter className="text-xs" />
            <span>Bộ lọc</span>
          </button>
          <button
            type="button"
            onClick={() => setShowColumns((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaTableColumns className="text-xs" />
            <span>Cột hiển thị</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setTypeFilter("all");
              setDeliveryFilter("all");
              setPaymentFilter("all");
              setVisibleColumns(DEFAULT_COLUMNS);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaRotateLeft className="text-xs" />
            <span>Đặt lại</span>
          </button>
        </div>

        {showFilters ? (
          <div className="mt-3 grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Trạng thái
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as OrderRecord["status"] | "all")
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="draft">Bản nháp</option>
                <option value="sent">Đã gửi</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="preparing">Đang chuẩn bị</option>
                <option value="ready">Sẵn sàng</option>
                <option value="delivered">Đã giao</option>
                <option value="completed">Hoàn tất</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Loại đơn
              </span>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as "all" | "order" | "ready_made")
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="order">Order</option>
                <option value="ready_made">Hàng sẵn</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Giao hàng
              </span>
              <select
                value={deliveryFilter}
                onChange={(event) =>
                  setDeliveryFilter(event.target.value as "all" | "pending" | "delivered")
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chưa giao</option>
                <option value="delivered">Đã giao</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Thanh toán
              </span>
              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(
                    event.target.value as "all" | OrderRecord["paymentStatus"],
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="partial">Thanh toán một phần</option>
                <option value="paid">Đã thanh toán</option>
                <option value="refunded">Hoàn tiền</option>
                <option value="void">Đã hủy</option>
              </select>
            </label>
          </div>
        ) : null}

        {showColumns ? (
          <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-3">
              {(Object.keys(visibleColumns) as ColumnKey[]).map((key) => {
                const labels: Record<ColumnKey, string> = {
                  order: "Đơn hàng",
                  customer: "Khách hàng",
                  type: "Loại đơn",
                  date: "Ngày",
                  total: "Tổng tiền",
                  paid: "Đã thu",
                  delivery: "Giao hàng",
                  payment: "Thanh toán",
                  open: "Mở",
                };

                return (
                  <label
                    key={key}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={(event) =>
                        setVisibleColumns((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    <span>{labels[key]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {filteredOrders.length === 0 ? (
        <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <h2 className="text-base font-semibold text-slate-900">Không có đơn phù hợp</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
            Thử bỏ bớt bộ lọc hoặc tìm lại bằng mã đơn, tên khách, số điện thoại.
          </p>
        </section>
      ) : (
        <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="overflow-hidden rounded-[20px] border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {visibleColumns.order ? <th className="px-4 py-3 font-medium">Đơn hàng</th> : null}
                  {visibleColumns.customer ? (
                    <th className="px-4 py-3 font-medium">Khách hàng</th>
                  ) : null}
                  {visibleColumns.type ? (
                    <th className="px-4 py-3 font-medium">Loại đơn</th>
                  ) : null}
                  {visibleColumns.date ? <th className="px-4 py-3 font-medium">Ngày</th> : null}
                  {visibleColumns.total ? (
                    <th className="px-4 py-3 font-medium">Tổng tiền</th>
                  ) : null}
                  {visibleColumns.paid ? <th className="px-4 py-3 font-medium">Đã thu</th> : null}
                  {visibleColumns.delivery ? (
                    <th className="px-4 py-3 font-medium">Giao hàng</th>
                  ) : null}
                  {visibleColumns.payment ? (
                    <th className="px-4 py-3 font-medium">Thanh toán</th>
                  ) : null}
                  {visibleColumns.open ? <th className="px-4 py-3 font-medium">Mở</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    {visibleColumns.order ? (
                      <td className="px-4 py-4 align-top">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-slate-900 transition hover:text-[#18352d]"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                    ) : null}
                    {visibleColumns.customer ? (
                      <td className="px-4 py-4 align-top text-slate-700">
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p className="mt-1 text-slate-500">{order.customerPhone ?? "—"}</p>
                      </td>
                    ) : null}
                    {visibleColumns.type ? (
                      <td className="px-4 py-4 align-top">
                        <StatusPill
                          label={formatOrderTypeLabel(order.orderType ?? "order")}
                          tone={orderTypeTone(order.orderType ?? "order")}
                        />
                      </td>
                    ) : null}
                    {visibleColumns.date ? (
                      <td className="px-4 py-4 align-top text-slate-500">
                        {formatDate(order.orderedAt)}
                      </td>
                    ) : null}
                    {visibleColumns.total ? (
                      <td className="px-4 py-4 align-top font-medium text-slate-900">
                        {formatCurrency(order.totalAmount ?? order.totalRevenue)}
                      </td>
                    ) : null}
                    {visibleColumns.paid ? (
                      <td className="px-4 py-4 align-top text-slate-700">
                        {formatCurrency(sumPayments(order))}
                      </td>
                    ) : null}
                    {visibleColumns.delivery ? (
                      <td className="px-4 py-4 align-top">
                        <StatusPill
                          label={formatDeliveryStatusLabel(order.deliveryStatus ?? "pending")}
                          tone={deliveryStatusTone(order.deliveryStatus ?? "pending")}
                        />
                      </td>
                    ) : null}
                    {visibleColumns.payment ? (
                      <td className="px-4 py-4 align-top">
                        <StatusPill
                          label={formatPaymentStatusLabel(order.paymentStatus ?? "unpaid")}
                          tone={paymentStatusTone(order.paymentStatus ?? "unpaid")}
                        />
                      </td>
                    ) : null}
                    {visibleColumns.open ? (
                      <td className="px-4 py-4 align-top">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          title="Mở hóa đơn"
                          aria-label="Mở hóa đơn"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
                        >
                          <FaArrowRight className="text-xs" />
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
