"use client";

import { useEffect, useState } from "react";
import { getDiscounts, updateDiscount } from "@/lib/actions/discounts";
import Modal from "@/components/Modal";
import { Search, Percent, Pencil } from "lucide-react";

interface DiscountRow {
  id: string;
  name: string;
  mobile: string;
  fatherName: string | null;
  discount: number;
  monthlyFee: number;
}

export default function DiscountsPage() {
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<DiscountRow | null>(null);
  const [editValue, setEditValue] = useState("");

  const loadData = async (q?: string) => {
    setLoading(true);
    try {
      const data = await getDiscounts(q || undefined);
      setRows(data as DiscountRow[]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

  const openEdit = (row: DiscountRow) => {
    setEditRow(row);
    setEditValue(String(row.discount));
  };

  const handleSave = async () => {
    if (!editRow) return;
    const val = parseFloat(editValue) || 0;
    await updateDiscount(editRow.id, Math.max(0, val));
    setEditRow(null);
    loadData(search);
  };

  const totalDiscount = rows.reduce((s, r) => s + r.discount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text-secondary">{rows.length}</span> student(s) &middot;
          ₹<span className="font-medium text-text-secondary">{totalDiscount.toLocaleString()}</span> total discount/mo
        </p>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="w-56 pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
        </form>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Percent className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? "No students match your search" : "No students found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase w-10">S.no</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Mobile</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Fee/Month</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Discount (₹)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Net/Month</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-hover/50 transition-colors duration-150">
                    <td className="px-4 py-3 text-text-muted text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text">{r.name}</td>
                    <td className="px-4 py-3 text-text-muted">{r.mobile}</td>
                    <td className="px-4 py-3 text-right text-text">₹{r.monthlyFee}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${r.discount > 0 ? "text-success" : "text-text-muted"}`}>
                        {r.discount > 0 ? `₹${r.discount}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text">
                      ₹{Math.max(0, r.monthlyFee - r.discount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg hover:bg-hover transition-colors inline-flex">
                        <Pencil className="w-4 h-4 text-text-muted hover:text-primary transition-colors" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!editRow} onClose={() => setEditRow(null)} title={`Discount — ${editRow?.name || ""}`} maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Monthly Fee: <span className="text-text font-bold">₹{editRow?.monthlyFee || 0}</span>
            </label>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Discount Amount (₹) <span className="text-text-muted">— per month</span>
            </label>
            <input type="number" min="0" value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300"
              placeholder="Enter discount amount" autoFocus />
            {editRow && parseFloat(editValue || "0") > 0 && (
              <p className="text-xs text-text-muted mt-1.5">
                Net monthly fee: <span className="text-text font-medium">₹{Math.max(0, (editRow.monthlyFee || 0) - (parseFloat(editValue) || 0))}</span>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditRow(null)}
              className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-all">Cancel</button>
            <button type="button" onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
