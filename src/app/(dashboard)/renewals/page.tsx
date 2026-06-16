"use client";

import { useEffect, useState } from "react";
import { getRenewals } from "@/lib/actions/renewals";
import { getStudents } from "@/lib/actions/students";
import { renewStudent } from "@/lib/actions/renewals";
import Modal from "@/components/Modal";
import DataTable from "@/components/DataTable";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface RenewalData { id: string; previousExpiry: Date; newExpiry: Date; renewalDate: Date; student: { id: string; name: string; mobile: string } }
interface StudentOption { id: string; name: string }

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<RenewalData[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [months, setMonths] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getRenewals() as Promise<RenewalData[]>, getStudents() as Promise<StudentOption[]>]);
      setRenewals(r); setStudents(s.map((st) => ({ id: st.id, name: st.name })));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const handleRenew = async () => {
    if (!selectedStudent) return;
    await renewStudent(selectedStudent, months);
    setShowModal(false); setSelectedStudent(""); setMonths(1); loadData();
  };

  const columns = [
    { key: "student", label: "Student", render: (item: RenewalData) => (
      <div><span className="font-medium text-text">{item.student.name}</span><br /><span className="text-xs text-text-muted">{item.student.mobile}</span></div>
    )},
    { key: "previousExpiry", label: "Previous Expiry", render: (item: RenewalData) => <span className="text-text-muted">{format(new Date(item.previousExpiry), "dd MMM yyyy")}</span> },
    { key: "newExpiry", label: "New Expiry", render: (item: RenewalData) => <span className="font-medium text-primary">{format(new Date(item.newExpiry), "dd MMM yyyy")}</span> },
    { key: "renewalDate", label: "Renewed On", render: (item: RenewalData) => <span className="text-text-muted">{format(new Date(item.renewalDate), "dd MMM yyyy")}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted"><span className="font-medium text-text-secondary">{renewals.length}</span> renewal(s)</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300">
          <RefreshCw className="w-4 h-4" /> Renew Student
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={renewals} searchPlaceholder="Search by student name..." pageSize={15} />
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Renew Student">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Student *</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Renew for *</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 6, 12].map((m) => (
                <button key={m} onClick={() => setMonths(m)}
                  className={`px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${months === m ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25" : "border border-border text-text-secondary hover:border-indigo-300"}`}>
                  {m}M
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-all">Cancel</button>
            <button onClick={handleRenew} disabled={!selectedStudent}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 disabled:opacity-50 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300">
              Renew for {months} Month{months > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
