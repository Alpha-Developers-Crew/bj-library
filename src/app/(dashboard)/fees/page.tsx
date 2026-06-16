"use client";

import { useEffect, useState } from "react";
import { getPayments, addPayment } from "@/lib/actions/fees";
import { getStudents } from "@/lib/actions/students";
import Modal from "@/components/Modal";
import DataTable from "@/components/DataTable";
import { Plus } from "lucide-react";

interface PaymentData {
  id: string; amount: number; paymentDate: Date; notes: string | null;
  student: { id: string; name: string; mobile: string };
}

interface StudentOption { id: string; name: string }

export default function FeesPage() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: "", amount: "", notes: "", mode: "CASH" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getPayments() as Promise<PaymentData[]>, getStudents() as Promise<StudentOption[]>]);
      setPayments(p); setStudents(s.map((st) => ({ id: st.id, name: st.name })));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPayment({ studentId: form.studentId, amount: parseFloat(form.amount), mode: form.mode, notes: form.notes || undefined });
    setShowModal(false); setForm({ studentId: "", amount: "", notes: "", mode: "CASH" }); loadData();
  };

  const columns = [
    { key: "student", label: "Student",
      render: (item: PaymentData) => (
        <div><span className="font-medium text-text">{item.student.name}</span><br /><span className="text-xs text-text-muted">{item.student.mobile}</span></div>
      )
    },
    { key: "amount", label: "Amount",
      render: (item: PaymentData) => <span className="font-bold text-primary">₹{item.amount.toLocaleString()}</span>
    },
    { key: "paymentDate", label: "Date",
      render: (item: PaymentData) => <span className="text-text-muted">{new Date(item.paymentDate).toLocaleDateString("en-IN")}</span>
    },
    { key: "notes", label: "Notes", render: (item: PaymentData) => <span className="text-text-muted">{item.notes || "—"}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted"><span className="font-medium text-text-secondary">{payments.length}</span> payment(s) recorded</p>
          <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={payments} searchPlaceholder="Search by student name..." pageSize={15} />
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Student *</label>
            <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount (₹) *</label>
            <input type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Payment Mode</label>
            <div className="flex gap-2">
              {["CASH", "ONLINE"].map((mode) => (
                <button key={mode} type="button" onClick={() => setForm({ ...form, mode })}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${
                    form.mode === mode
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white border-primary shadow-lg shadow-primary/25"
                      : "bg-surface border-border text-text-secondary hover:border-primary"
                  }`}>{mode === "CASH" ? "💵 Cash" : "🏦 Online (A/C)"}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-all">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
