"use client";

import type { ChangeEvent } from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaFileArrowDown, FaFileImport, FaTriangleExclamation } from "react-icons/fa6";
import * as XLSX from "xlsx";
import { importMenuProductsFromExcelAction } from "@/lib/admin/actions";
import type { ActionState, AdminCategory } from "@/lib/admin/types";

const initialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

const TEMPLATE_HEADERS = [
  "Mã món",
  "Tên món",
  "Nhóm",
  "Tên loại",
  "Trọng lượng (g)",
  "Giá vốn",
  "Giá bán",
  "Giá niêm yết",
  "Mặc định",
  "Đang dùng",
  "Thứ tự loại",
  "Ghi chú",
];

const IMPORT_HEADER_HINTS = [
  "Mã món",
  "Tên món",
  "Món",
  "Nhóm",
  "Nhóm hàng",
  "Tên loại",
  "Loại",
  "Trọng lượng (g)",
  "Trọng lượng",
  "Khối lượng",
  "Giá vốn",
  "Giá bán",
  "Giá niêm yết",
  "Mặc định",
  "Đang dùng",
  "Thứ tự loại",
  "Ghi chú",
];

function getRowValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value == null) {
      continue;
    }

    const text = String(value).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return "";
}

function scoreImportRow(row: Record<string, unknown>) {
  const productName = getRowValue(row, ["Tên món", "Món", "ten mon", "ten_mon"]);
  const categoryName = getRowValue(row, ["Nhóm", "Nhóm hàng", "nhom", "nhom_hang"]);
  const variantLabel = getRowValue(row, ["Tên loại", "Loại", "ten loai", "ten_loai"]);
  const weight = getRowValue(row, [
    "Trọng lượng (g)",
    "Trọng lượng",
    "Khối lượng",
    "trong luong (g)",
    "khoi_luong",
  ]);
  const price = getRowValue(row, ["Giá bán", "gia ban", "gia_ban"]);
  const cost = getRowValue(row, ["Giá vốn", "gia von", "gia_von"]);

  return [productName, categoryName, variantLabel || weight, price, cost].filter(
    (value) => value.length > 0,
  ).length;
}

function scoreWorkbookSheet(rows: Record<string, unknown>[]) {
  return rows.reduce((score, row) => score + (scoreImportRow(row) >= 4 ? 1 : 0), 0);
}

function buildTemplateWorkbook(categories: AdminCategory[]) {
  const workbook = XLSX.utils.book_new();
  const rows = [
    TEMPLATE_HEADERS,
    ["", "Ức gà cajun", "Món chính", "100g", 100, 32000, 58000, "", "Có", "Có", 1, "Món mẫu"],
    ["", "Ức gà cajun", "Món chính", "150g", 150, 48000, 86000, "", "", "Có", 2, ""],
    ["", "Nạc heo ngũ vị", "Món chính", "100g", 100, 21000, 30000, "", "Có", "Có", 1, ""],
    ["", "Nạc heo ngũ vị", "Món chính", "150g", 150, 30000, 44000, "", "", "Có", 2, ""],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, "Món hàng");

  const guideRows = [
    ["Hướng dẫn"],
    ["1. Mỗi dòng là một loại món."],
    ["2. Các dòng có cùng Tên món + Nhóm sẽ được gộp vào cùng một món."],
    ["3. Nếu có Mã món / Mã loại cũ, để trống vẫn nạp được."],
    ["4. File sẽ nạp hoặc cập nhật theo Tên món + Nhóm + Trọng lượng."],
    ["5. Loại cũ không có trong file sẽ chưa bị xoá tự động."],
    ["Nhóm có sẵn"],
    ...categories.map((category) => [category.name, category.slug]),
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  guideSheet["!cols"] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Hướng dẫn");

  return workbook;
}

export function MenuExcelImportPanel({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const [state, action, pending] = useActionState(
    importMenuProductsFromExcelAction,
    initialState,
  );
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      setRows([]);
      setFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    }
  }, [router, state.status]);

  const rowCount = rows.length;
  const categoryHint = useMemo(
    () => categories.slice(0, 4).map((category) => category.name).join(" · "),
    [categories],
  );

  const handleTemplateDownload = () => {
    const workbook = buildTemplateWorkbook(categories);
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "template-mon-hang.xlsx";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setParseError("");
    setFileName(file.name);
    setSheetName("");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      if (workbook.SheetNames.length === 0) {
        setRows([]);
        setParseError("File Excel không có sheet dữ liệu.");
        return;
      }

      let bestRows: Record<string, unknown>[] = [];
      let bestSheetName = "";
      let bestScore = 0;

      for (const candidateSheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[candidateSheetName];
        const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        });
        const score = scoreWorkbookSheet(parsed);

        if (score > bestScore) {
          bestScore = score;
          bestSheetName = candidateSheetName;
          bestRows = parsed;
        }
      }

      if (bestScore === 0) {
        setRows([]);
        setParseError(
          `Không tìm thấy sheet dữ liệu hợp lệ. Hãy mở đúng tab có các cột ${IMPORT_HEADER_HINTS.slice(0, 6).join(", ")}...`,
        );
        return;
      }

      setSheetName(bestSheetName);
      setRows(bestRows);
    } catch {
      setRows([]);
      setParseError("Không đọc được file Excel. Hãy dùng template tải từ app.");
    }
  };

  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Nạp Excel
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            Tải template rồi nạp món hàng
          </h3>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            Một dòng là một loại món. Các dòng trùng Tên món + Nhóm sẽ được gộp vào cùng
            một món.
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-400">
            Nhập nhanh theo sheet bạn đang dùng, không cần tạo tay từng món.
            {categoryHint ? ` Nhóm đang có: ${categoryHint}.` : ""}
          </p>
          {sheetName ? (
            <p className="mt-1 text-[12px] leading-5 text-emerald-700">
              Đã đọc sheet: {sheetName}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTemplateDownload}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaFileArrowDown className="text-xs" />
            <span>Tải template</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
          >
            <FaFileImport className="text-xs" />
            <span>Chọn file Excel</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            {fileName.length > 0 ? fileName : "Chưa chọn file"}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            {rowCount > 0
              ? `Đã đọc ${rowCount} dòng từ file. Kiểm tra rồi bấm nạp để cập nhật/chèn món.`
              : "Hệ thống sẽ đọc file Excel và nạp theo Tên món + Nhóm + Trọng lượng."}
          </p>
        </div>

        <form action={action}>
          <input type="hidden" name="payload" value={JSON.stringify({ rows })} />
          <button
            type="submit"
            disabled={pending || rows.length === 0}
            className="inline-flex h-full items-center gap-2 rounded-full bg-[#18352d] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaFileImport className="text-xs" />
            <span>{pending ? "Đang nạp..." : "Nạp file"}</span>
          </button>
        </form>
      </div>

      {parseError.length > 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-400/10 px-3 py-2 text-sm text-rose-700">
          <FaTriangleExclamation className="text-xs" />
          <span>{parseError}</span>
        </p>
      ) : null}

      {state.status !== "idle" ? (
        <p
          className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-emerald-400/15 text-emerald-700"
              : "bg-rose-400/15 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
