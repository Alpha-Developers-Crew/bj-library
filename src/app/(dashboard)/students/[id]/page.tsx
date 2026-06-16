"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getStudent, updateStudent, deleteStudent } from "@/lib/actions/students";
import { assignSeat, removeAssignment } from "@/lib/actions/seats";
import { addPayment } from "@/lib/actions/fees";
import { renewStudent, setCustomExpiry } from "@/lib/actions/renewals";
import { getSlots } from "@/lib/actions/slots";
import { getSeats } from "@/lib/actions/seats";
import Modal from "@/components/Modal";
import { ArrowLeft, RefreshCw, IndianRupee, Trash2, Plus, Clock, Phone, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { format, isBefore } from "date-fns";

interface StudentData {
  id: string; name: string; mobile: string; address: string | null; fatherName: string | null; motherName: string | null;
  joinDate: Date; expiryDate: Date; activeStatus: boolean;
  assignments: { id: string; seat: { id: string; seatNumber: number }; timeSlot: { id: string; name: string; fee: number; startTime: string; endTime: string }; assignmentDate: Date }[];
  payments: { id: string; amount: number; paymentDate: Date; notes: string | null }[];
  renewals: { id: string; previousExpiry: Date; newExpiry: Date; renewalDate: Date }[];
}

export default function StudentDetailPage() {
  const params = useParams(); const router = useRouter(); const searchParams = useSearchParams();
  const id = params.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [slots, setSlots] = useState([]);
  const [allSeats, setAllSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "true");
  const [editForm, setEditForm] = useState({ name: "", mobile: "", address: "", fatherName: "", motherName: "", expiryDate: "" });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ seatId: "", timeSlotId: "" });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", notes: "", mode: "CASH" });
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState(1);
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, sl, st] = await Promise.all([getStudent(id), getSlots(), getSeats()]);
      setStudent(s as StudentData); setSlots(sl as []); setAllSeats(st as []);
      if (s) setEditForm({ name: s.name, mobile: s.mobile, address: s.address || "", fatherName: s.fatherName || "", motherName: s.motherName || "", expiryDate: format(new Date(s.expiryDate), "yyyy-MM-dd") });
    } catch {}
    setLoading(false);
  };
  useEffect(() => { loadData(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => { e.preventDefault(); await updateStudent(id, editForm); setEditMode(false); loadData(); };
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await assignSeat({ studentId: id, seatId: assignForm.seatId, timeSlotId: assignForm.timeSlotId });
    if (result?.error) { alert(result.error); return; }
    setShowAssignModal(false); setAssignForm({ seatId: "", timeSlotId: "" }); loadData();
  };
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault(); await addPayment({ studentId: id, amount: parseFloat(paymentForm.amount), mode: paymentForm.mode, notes: paymentForm.notes || undefined });
    setShowPaymentModal(false); setPaymentForm({ amount: "", notes: "", mode: "CASH" }); loadData();
  };
  const handleRenew = async () => { await renewStudent(id, renewMonths); setShowRenewModal(false); loadData(); };
  const handleCustomExpiry = async () => { if (!customExpiryDate) return; await setCustomExpiry(id, customExpiryDate); setShowRenewModal(false); setCustomExpiryDate(""); loadData(); };
  const handleDelete = async () => { await deleteStudent(id); router.push("/students"); };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!student) return <div className="text-center py-12 text-text-muted">Student not found</div>;

  const expired = isBefore(new Date(student.expiryDate), new Date());
  const monthlyFee = student.assignments.reduce((sum, a) => sum + a.timeSlot.fee, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const pending = Math.max(0, monthlyFee - totalPaid);

  const availableSeatsForSlot = (slotId: string) => {
    const slot = (slots as { id: string; assignments: { seat: { seatNumber: number } }[] }[]).find((s) => s.id === slotId);
    if (!slot) return [];
    const assignedNums = slot.assignments.map((a) => a.seat.seatNumber);
    return (allSeats as { id: string; seatNumber: number }[]).filter((s) => !assignedNums.includes(s.seatNumber));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <Link href="/students" className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/25">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text">{student.name}</h2>
              <p className="text-text-muted">{student.mobile}</p>
              <span className={`inline-block mt-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${expired ? "bg-danger/15 text-danger border border-danger/25" : "bg-success/15 text-success border border-success/25"}`}>
                {expired ? "Expired" : "Active"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
              {[{ label: "Edit", onClick: () => setEditMode(!editMode), color: "from-primary to-primary-dark" },
               { label: "Assign Seat", onClick: () => setShowAssignModal(true), color: "from-primary to-primary-dark" },
               { label: "Renew", onClick: () => setShowRenewModal(true), color: "from-success to-success-dark" },
               { label: "Payment", onClick: () => setShowPaymentModal(true), color: "from-warning to-warning/80" },
               { label: "Delete", onClick: () => setDeleteConfirm(true), color: "from-danger to-danger-dark" },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.onClick}
                className={`px-4 py-2 bg-gradient-to-r ${btn.color} text-white rounded-xl text-sm font-medium shadow-lg hover:opacity-90 transition-all duration-300`}>
                {btn.label === "Assign Seat" && <Plus className="w-3.5 h-3.5 inline mr-1" />}
                {btn.label === "Renew" && <RefreshCw className="w-3.5 h-3.5 inline mr-1" />}
                {btn.label === "Payment" && <IndianRupee className="w-3.5 h-3.5 inline mr-1" />}
                {btn.label === "Delete" && <Trash2 className="w-3.5 h-3.5 inline mr-1" />}
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleUpdate} className="space-y-4 border-t border-border pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ key: "name", label: "Name" }, { key: "mobile", label: "Mobile" },
                { key: "fatherName", label: "Father's Name" }, { key: "motherName", label: "Mother's Name" },
                { key: "expiryDate", label: "Expiry Date", type: "date" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={editForm[f.key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                <textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">Save Changes</button>
              <button type="button" onClick={() => setEditMode(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-5">
            {[
              { icon: Phone, label: "Mobile", value: student.mobile },
              { icon: Users, label: "Father", value: student.fatherName || "-" },
              { icon: Users, label: "Mother", value: student.motherName || "-" },
              { icon: MapPin, label: "Address", value: student.address || "-", span: true },
              { icon: Clock, label: "Join Date", value: format(new Date(student.joinDate), "dd MMM yyyy") },
              { icon: Clock, label: "Expiry Date", value: format(new Date(student.expiryDate), "dd MMM yyyy"), highlight: expired },
            ].map((item) => (
              <div key={item.label}
                className={`${item.span ? "sm:col-span-3" : ""} flex items-center gap-3 p-3 rounded-xl bg-hover/50`}>
                <item.icon className={`w-4 h-4 ${item.highlight ? "text-danger" : "text-text-muted"}`} />
                <div>
                  <span className="text-xs text-text-muted">{item.label}: </span>
                  <span className={`text-sm font-medium ${item.highlight ? "text-danger" : "text-text"}`}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-hover rounded-lg"><Plus className="w-4 h-4 text-primary" /></div>
            <h3 className="font-bold text-text">Seat Assignments</h3>
          </div>
          <button onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Assign Seat
          </button>
        </div>
        {student.assignments.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">No seats assigned yet</p>
        ) : (
          <div className="space-y-2">
            {student.assignments.map((a) => (
              <div key={a.id}
                className="flex items-center justify-between p-3.5 bg-hover rounded-xl border border-border">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 bg-primary/15 text-primary-dark rounded-lg text-xs font-bold">Seat {a.seat.seatNumber}</span>
                  <span className="text-sm text-text-secondary">{a.timeSlot.name}</span>
                  <span className="text-xs text-text-muted">({a.timeSlot.startTime} - {a.timeSlot.endTime})</span>
                  <span className="text-sm font-bold text-primary">₹{a.timeSlot.fee}/mo</span>
                </div>
                <button onClick={async () => { await removeAssignment(a.id); loadData(); }}
                  className="text-danger/60 hover:text-danger text-sm font-medium transition-colors">&times;</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-hover rounded-lg"><IndianRupee className="w-4 h-4 text-success" /></div>
            <h3 className="font-bold text-text">Fee Summary</h3>
          </div>
          <button onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-success to-success-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-success/25 hover:from-success-dark hover:to-success transition-all duration-300">
            Record Payment
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { label: "Monthly Fee", value: monthlyFee, color: "text-primary" },
            { label: "Total Paid", value: totalPaid, color: "text-primary" },
            { label: "Pending", value: pending, color: "text-danger" },
          ].map((item) => (
            <div key={item.label} className="bg-hover/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-text-muted">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>₹{item.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {student.payments.length > 0 && (
          <div>
            <h4 className="font-semibold text-text mb-3 text-sm">Payment History</h4>
            <div className="space-y-1.5">
              {student.payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm py-2.5 px-3 rounded-xl hover:bg-hover transition-colors">
                  <span className="text-text-secondary">
                    {format(new Date(p.paymentDate), "dd MMM yyyy")}
                    {p.notes && <span className="text-text-muted ml-2">· {p.notes}</span>}
                  </span>
                  <span className="font-bold text-primary">₹{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {student.renewals.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-hover rounded-lg"><RefreshCw className="w-4 h-4 text-success" /></div>
            <h3 className="font-bold text-text">Renewal History</h3>
          </div>
          <div className="space-y-1.5">
            {student.renewals.map((r) => (
              <div key={r.id}
                className="flex justify-between items-center text-sm py-2.5 px-3 rounded-xl hover:bg-hover transition-colors">
                <span className="text-text-secondary">
                  {format(new Date(r.renewalDate), "dd MMM yyyy")} — Extended from{" "}
                  <span className="text-text-muted">{format(new Date(r.previousExpiry), "dd MMM yyyy")}</span>
                </span>
                <span className="font-medium text-primary">to {format(new Date(r.newExpiry), "dd MMM yyyy")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Seat">
        <form onSubmit={handleAssign} className="space-y-4">
          <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Time Slot *</label>
            <select required value={assignForm.timeSlotId} onChange={(e) => setAssignForm({ ...assignForm, timeSlotId: e.target.value, seatId: "" })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              <option value="">Select slot</option>
              {(slots as { id: string; name: string; startTime: string; endTime: string; fee: number }[]).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime}) — ₹{s.fee}</option>
              ))}
            </select></div>
          {assignForm.timeSlotId && (
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Seat *</label>
              <select required value={assignForm.seatId} onChange={(e) => setAssignForm({ ...assignForm, seatId: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                <option value="">Select seat</option>
                {availableSeatsForSlot(assignForm.timeSlotId).map((s) => (
                  <option key={s.id} value={s.id}>Seat {s.seatNumber}</option>
                ))}
              </select></div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">Assign</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Amount (₹) *</label>
            <input type="number" required min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Payment Mode</label>
            <div className="flex gap-2">
              {["CASH", "ONLINE"].map((mode) => (
                <button key={mode} type="button" onClick={() => setPaymentForm({ ...paymentForm, mode })}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${
                    paymentForm.mode === mode
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white border-primary shadow-lg shadow-primary/25"
                      : "bg-surface border-border text-text-secondary hover:border-primary"
                  }`}>{mode === "CASH" ? "💵 Cash" : "🏦 Online (A/C)"}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
            <input type="text" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="Optional" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">Record Payment</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title="Renew Student">
        <div className="space-y-5">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 6, 12].map((m) => (
              <button key={m} onClick={() => setRenewMonths(m)}
                className={`px-3 py-3 rounded-xl text-sm font-bold transition-all ${renewMonths === m ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25" : "border border-border text-text-secondary hover:border-primary"}`}>
                +{m}M
              </button>
            ))}
          </div>
          <button onClick={handleRenew}
            className="w-full px-5 py-3 bg-gradient-to-r from-success to-success-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-success/25 hover:from-success-dark hover:to-success transition-all duration-300">
            Renew for {renewMonths} Month{renewMonths > 1 ? "s" : ""}
          </button>
          <div className="border-t border-border pt-5">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Or set custom expiry</label>
            <div className="flex gap-2">
              <input type="date" value={customExpiryDate} onChange={(e) => setCustomExpiryDate(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              <button onClick={handleCustomExpiry} disabled={!customExpiryDate}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 disabled:opacity-50 hover:from-primary-dark hover:to-primary transition-all duration-300">Set</button>
            </div>
          </div>
        </div>
      </Modal>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-text mb-2">Delete Student</h3>
            <p className="text-text-muted mb-6">Permanently delete <strong>{student.name}</strong>? All assignments and payments will be lost.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover">Cancel</button>
              <button onClick={handleDelete}
                className="px-5 py-2.5 bg-gradient-to-r from-danger to-danger-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-danger/25 hover:from-danger-dark hover:to-danger-darker transition-all duration-300">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
