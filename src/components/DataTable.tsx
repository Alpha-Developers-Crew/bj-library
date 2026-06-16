"use client";

import { useState, ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

interface Column<T = AnyObj> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T = AnyObj> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  onExport?: () => void;
  onPrint?: () => void;
  pageSize?: number;
  emptyMessage?: string;
}

export default function DataTable<T extends AnyObj = AnyObj>({
  columns, data, searchable = true, searchPlaceholder = "Search...",
  searchKeys = [], onExport, onPrint, pageSize = 10,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  let filtered = data;
  if (search) {
    const q = search.toLowerCase();
    filtered = data.filter((item) =>
      searchKeys.length > 0
        ? searchKeys.some((key) => { const val = item[key]; return val && String(val).toLowerCase().includes(q); })
        : Object.values(item).some((val) => val && String(val).toLowerCase().includes(q))
    );
  }

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {searchable && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder={searchPlaceholder} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-body/60 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder-[#5D6A8F]" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {onExport && (
            <button onClick={onExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-[#080C1E] rounded-xl text-sm font-medium hover:from-primary-dark hover:to-[#A67A2A] transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-hover text-text-secondary rounded-xl text-sm font-medium hover:bg-[#26334F] hover:text-text transition-all border border-border-light">
              <Printer className="w-4 h-4" /> Print
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-surface rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              {columns.map((col) => (
                <th key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-5 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap ${
                    col.sortable !== false ? "cursor-pointer hover:text-primary" : ""
                  } ${col.className || ""}`}>
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {sortKey === col.key && <span className="text-primary">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2A44]">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-text-muted">
                  <Search className="w-8 h-8 mx-auto mb-2 text-[#26334F]" />
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paged.map((item, idx) => (
                <tr key={idx} className="hover:bg-hover transition-colors duration-150">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-3.5 whitespace-nowrap text-text ${col.className || ""}`}>
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-medium text-text">{Math.min(page * pageSize, filtered.length)}</span> of{" "}
            <span className="font-medium text-text">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-2 rounded-xl border border-border-light hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pn: number;
              if (totalPages <= 5) pn = i + 1;
              else if (page <= 3) pn = i + 1;
              else if (page >= totalPages - 2) pn = totalPages - 4 + i;
              else pn = page - 2 + i;
              return (
                <button key={pn} onClick={() => setPage(pn)}
                  className={`min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
                    page === pn ? "bg-gradient-to-r from-primary to-primary-dark text-[#080C1E]" : "border border-border-light text-text-secondary hover:bg-hover"
                  }`}>
                  {pn}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl border border-border-light hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
