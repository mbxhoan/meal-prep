"use client";

import { useActionState, useMemo, useState } from "react";
import {
  deleteMasterDataAction,
  saveMasterDataAction,
} from "@/lib/master-data/actions";
import {
  getDefaultDraftValue,
  getNestedValue,
} from "@/lib/master-data/validation";
import type {
  MasterDataEntityConfig,
  MasterDataOptionGroup,
  MasterDataRow,
} from "@/lib/master-data/types";
import { StatusPill } from "@/features/admin/components/StatusPill";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type { ActionState } from "@/lib/admin/types";

const initialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

type DraftValue = string | number | boolean | null;

function buildDraftFromRow(
  config: MasterDataEntityConfig,
  row: MasterDataRow | null,
): Record<string, DraftValue> {
  const draft: Record<string, DraftValue> = {};

  for (const field of config.fields) {
    if (!row) {
      draft[field.name] = getDefaultDraftValue(field);
      continue;
    }

    const value = row[field.name as keyof MasterDataRow];

    if (field.type === "checkbox") {
      draft[field.name] = value === true;
      continue;
    }

    draft[field.name] =
      value == null ? "" : String(value);
  }

  return draft;
}

function formatColumnValue(
  value: unknown,
  type: MasterDataEntityConfig["columns"][number]["type"],
) {
  if (value == null || value === "") {
    return "—";
  }

  switch (type) {
    case "money":
      return formatCurrency(Number(value) || 0);
    case "percent":
      return `${Number(value) || 0}%`;
    case "date":
      return formatDate(String(value));
    case "number":
      return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 2,
      }).format(Number(value) || 0);
    case "boolean":
      return String(Boolean(value));
    default:
      return String(value);
  }
}

function resolvePath(
  row: Record<string, unknown>,
  path: string,
): unknown {
  return getNestedValue(row, path);
}

export function MasterDataCrudPage({
  config,
  rows,
  optionGroups,
  canCreate,
  canUpdate,
  canDelete,
  shopName,
}: {
  config: MasterDataEntityConfig;
  rows: MasterDataRow[];
  optionGroups: MasterDataOptionGroup[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  shopName: string;
}) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, DraftValue>>(
    buildDraftFromRow(config, null),
  );
  const [state, action, pending] = useActionState(
    saveMasterDataAction,
    initialState,
  );
  const [, deleteAction] = useActionState(
    deleteMasterDataAction,
    initialState,
  );

  const selectedRow =
    rows.find((row) => row.id === selectedId) ?? null;
  const filteredRows = useMemo(() => {
    const searchable = config.searchFields;
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const isArchived =
        row.deleted_at != null || row.is_active === false;

      if (!showArchived && isArchived) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      return searchable.some((field) => {
        const value = resolvePath(row, field);

        return (
          value != null &&
          String(value).toLowerCase().includes(normalizedQuery)
        );
      });
    });
  }, [config.searchFields, query, rows, showArchived]);

  const optionLookup = useMemo(() => {
    const map = new Map<string, MasterDataOptionGroup>();

    for (const group of optionGroups) {
      map.set(group.key, group);
    }

    return map;
  }, [optionGroups]);

  const handleBeginCreate = () => {
    setSelectedId(null);
    setDraft(buildDraftFromRow(config, null));
  };

  const handleBeginEdit = (row: MasterDataRow) => {
    setSelectedId(row.id);
    setDraft(buildDraftFromRow(config, row));
  };

  const handleFieldChange = (name: string, value: string | boolean) => {
    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const payload = JSON.stringify({
    entity: config.key,
    recordId: selectedRow?.id ?? null,
    values: draft,
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              {shopName}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              {config.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              {config.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={showArchived ? "Đang xem cả archived" : "Chỉ active"}
              tone={showArchived ? "warning" : "success"}
            />
            <button
              type="button"
              onClick={() => setShowArchived((current) => !current)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {showArchived ? "Ẩn archived" : "Hiện archived"}
            </button>
            {canCreate ? (
              <button
                type="button"
                onClick={handleBeginCreate}
                className="rounded-full bg-[#18352d] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Tạo mới
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] lg:grid-cols-[1.15fr_0.85fr]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tìm kiếm
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            placeholder="Tìm theo mã, tên, ghi chú..."
          />
        </label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <p className="font-medium text-slate-900">
            {filteredRows.length} bản ghi
          </p>
          <p className="mt-1">
            {canUpdate
              ? "Chọn một dòng để sửa. Delete sẽ chuyển sang archived."
              : "Bạn chỉ có quyền xem dữ liệu."}
          </p>
        </div>
      </section>

      {canCreate || canUpdate ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Form
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {selectedRow ? "Chỉnh sửa bản ghi" : "Tạo bản ghi mới"}
              </h2>
            </div>
            {selectedRow ? (
              <button
                type="button"
                onClick={handleBeginCreate}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Reset form
              </button>
            ) : null}
          </div>

          <form action={action} className="mt-6 space-y-4">
            <input type="hidden" name="payload" value={payload} />

            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.map((field) => {
                const fieldValue = draft[field.name];

                if (field.type === "checkbox") {
                  return (
                    <label
                      key={field.name}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(fieldValue)}
                        onChange={(event) =>
                          handleFieldChange(field.name, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[#18352d] focus:ring-[#18352d]"
                      />
                      <span>{field.label}</span>
                    </label>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <label key={field.name} className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        {field.label}
                      </span>
                      <textarea
                        value={String(fieldValue ?? "")}
                        onChange={(event) =>
                          handleFieldChange(field.name, event.target.value)
                        }
                        rows={4}
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>
                  );
                }

                if (field.type === "select") {
                  const options = field.options ?? (
                    field.optionsSource
                      ? optionLookup.get(field.optionsSource)?.options ?? []
                      : []
                  );

                  return (
                    <label key={field.name} className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        {field.label}
                      </span>
                      <select
                        value={String(fieldValue ?? "")}
                        onChange={(event) =>
                          handleFieldChange(field.name, event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                      >
                        <option value="">Chọn {field.label.toLowerCase()}</option>
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                    <input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={String(fieldValue ?? "")}
                      onChange={(event) =>
                        handleFieldChange(field.name, event.target.value)
                      }
                      placeholder={field.placeholder}
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                  </label>
                );
              })}
            </div>

            {state.message ? (
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {selectedRow
                  ? "Lưu sẽ cập nhật bản ghi hiện tại."
                  : "Lưu sẽ tạo bản ghi mới trong shop hiện tại."}
              </p>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Danh sách
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {config.title}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[24px] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {config.columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 font-medium text-slate-500"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.map((row) => (
                <tr key={row.id} className="align-top">
                  {config.columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 text-slate-700">
                      {column.type === "boolean" ? (
                        <StatusPill
                          label={Boolean(resolvePath(row, column.key)) ? "Active" : "Inactive"}
                          tone={Boolean(resolvePath(row, column.key)) ? "success" : "muted"}
                        />
                      ) : (
                        formatColumnValue(
                          resolvePath(row, column.key),
                          column.type,
                        )
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {canUpdate ? (
                        <button
                          type="button"
                          onClick={() => handleBeginEdit(row)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Sửa
                        </button>
                      ) : null}
                      {canDelete ? (
                        <form
                          action={deleteAction}
                          onSubmit={(event) => {
                            if (
                              !window.confirm(
                                `Xoá ${config.title.toLowerCase()} này?`,
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input
                            type="hidden"
                            name="payload"
                            value={JSON.stringify({
                              entity: config.key,
                              recordId: row.id,
                            })}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                          >
                            Xoá
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length + 1}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
