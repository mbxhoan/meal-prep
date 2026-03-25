"use client";

import type { ReactNode } from "react";
import { FaFileExcel } from "react-icons/fa6";

type ExportCellValue = string | number | boolean | null | undefined;

export interface ExportExcelColumn {
  key: string;
  label: string;
}

export interface ExportExcelButtonProps {
  filename: string;
  sheetName?: string;
  title?: string;
  columns: ExportExcelColumn[];
  rows: Array<Record<string, ExportCellValue>>;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stringifyCell(value: ExportCellValue) {
  if (value == null) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  return String(value);
}

function buildWorkbookHtml(
  title: string,
  sheetName: string,
  columns: ExportExcelColumn[],
  rows: Array<Record<string, ExportCellValue>>,
) {
  const tableHead = columns
    .map(
      (column) =>
        `<th style="border:1px solid #dbe4dd;padding:8px 10px;background:#f3f7f4;text-align:left;">${escapeHtml(column.label)}</th>`,
    )
    .join("");

  const tableBody = rows
    .map((row) => {
      const cells = columns
        .map(
          (column) =>
            `<td style="border:1px solid #dbe4dd;padding:8px 10px;vertical-align:top;">${escapeHtml(stringifyCell(row[column.key]))}</td>`,
        )
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="ProgId" content="Excel.Sheet" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <table>
    <tr><td colspan="${Math.max(columns.length, 1)}" style="font-size:16px;font-weight:700;padding:8px 10px;">${escapeHtml(title)}</td></tr>
    <tr><td colspan="${Math.max(columns.length, 1)}" style="padding:0 0 12px 0;color:#6b7280;">${escapeHtml(sheetName)}</td></tr>
    <tr>${tableHead}</tr>
    ${tableBody}
  </table>
</body>
</html>`;
}

export function ExportExcelButton({
  filename,
  sheetName = "Sheet1",
  title = "Xuất Excel",
  columns,
  rows,
  className = "",
  icon,
  disabled = false,
}: ExportExcelButtonProps) {
  const handleClick = () => {
    if (disabled || rows.length === 0) {
      return;
    }

    const html = buildWorkbookHtml(title, sheetName, columns, rows);
    const blob = new Blob(["\ufeff", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = filename.endsWith(".xls") || filename.endsWith(".xlsx")
      ? filename
      : `${filename}.xls`;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const iconNode = icon ?? <FaFileExcel />;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || rows.length === 0}
      title={title}
      aria-label={title}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span className="text-base">{iconNode}</span>
      <span className="sr-only">{title}</span>
    </button>
  );
}

export default ExportExcelButton;
