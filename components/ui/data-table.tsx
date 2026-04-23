import type { ReactNode } from 'react';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyText = 'Chưa có dữ liệu'
}: {
  columns: Array<Column<T>>;
  rows: T[];
  emptyText?: string;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">{emptyText}</div>
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {columns.map((column) => (
                  <td key={String(column.key)} className={column.className}>
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
