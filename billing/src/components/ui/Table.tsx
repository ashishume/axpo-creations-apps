import React from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "No data found",
  loading = false,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="skeleton h-4 w-full rounded"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-8">
                <p style={{ color: "var(--text-secondary)" }}>{emptyMessage}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={String(item[keyField])}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
