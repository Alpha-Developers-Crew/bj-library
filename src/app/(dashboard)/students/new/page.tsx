"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createStudentWithSeatAndFee } from "@/lib/actions/students";
import { getSlots } from "@/lib/actions/slots";
import { getSeats } from "@/lib/actions/seats";
import { ArrowLeft, UserPlus, Plus, X } from "lucide-react";
import Link from "next/link";
import { addMonths, differenceInCalendarMonths, format } from "date-fns";

interface Slot { id: string; name: string; startTime: string; endTime: string; fee: number; assignments: { student: { id: string }; seat: { id: string } }[] }
interface Seat { id: string; seatNumber: number; assignments: { timeSlot: { id: string } }[] }

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [form, setForm] = useState({
    name: "", mobile: "", address: "", fatherName: "", motherName: "",
    joinDate: format(new Date(), "yyyy-MM-dd"),
    expiryDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    discount: "",
    feeAmount: "", paymentMode: "CASH",
  });
  const [assignments, setAssignments] = useState([{ timeSlotId: "", seatId: "" }]);

  useEffect(() => {
    Promise.all([getSlots(), getSeats()]).then(([s, se]) => {
      setSlots(s as Slot[]);
      setSeats(se as Seat[]);
    });
  }, []);

  const addAssignment = () => setAssignments([...assignments, { timeSlotId: "", seatId: "" }]);
  const removeAssignment = (idx: number) => {
    if (assignments.length <= 1) return;
    setAssignments(assignments.filter((_, i) => i !== idx));
  };
  const updateAssignment = (idx: number, key: "timeSlotId" | "seatId", value: string) => {
    const updated = assignments.map((a, i) => i === idx ? { ...a, [key]: value } : a);
    setAssignments(updated);
  };

  const usedSlotIds = assignments.map((a) => a.timeSlotId).filter(Boolean);
  const totalSlotFee = assignments.reduce((sum, a) => {
    const slot = slots.find((s) => s.id === a.timeSlotId);
    return sum + (slot?.fee || 0);
  }, 0);
  const discount = parseFloat(form.discount) || 0;
  const netMonthly = Math.max(0, totalSlotFee - discount);
  const joinDate = form.joinDate ? new Date(form.joinDate) : new Date();
  const expiryDate = form.expiryDate ? new Date(form.expiryDate) : new Date();
  const totalMonths = Math.max(1, differenceInCalendarMonths(expiryDate, joinDate));
  const totalDue = netMonthly * totalMonths;

  const getAvailableSeats = (slotId: string, currentIdx: number) => {
    if (!slotId) return [];
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return [];
    const takenNums = new Set(slot.assignments.map((a) => a.seat.id));
    const selectedInForm = new Set<string>();
    assignments.forEach((a, i) => {
      if (i !== currentIdx && a.timeSlotId === slotId && a.seatId) selectedInForm.add(a.seatId);
    });
    return seats.filter((s) => !takenNums.has(s.id) || selectedInForm.has(s.id));
  };

  const getAvailableSlots = (currentIdx: number) => {
    const selectedOtherSlots = assignments
      .filter((_, i) => i !== currentIdx)
      .map((a) => a.timeSlotId)
      .filter(Boolean);
    return slots.filter((s) => !selectedOtherSlots.includes(s.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const validAssignments = assignments.filter((a) => a.timeSlotId && a.seatId);
      await createStudentWithSeatAndFee({
        name: form.name, mobile: form.mobile, address: form.address,
        fatherName: form.fatherName, motherName: form.motherName,
        joinDate: form.joinDate, expiryDate: form.expiryDate,
        assignments: validAssignments.length > 0 ? validAssignments : undefined,
        feeAmount: form.feeAmount ? parseFloat(form.feeAmount) : undefined,
        paymentMode: form.paymentMode,
        discount: form.discount ? parseFloat(form.discount) : 0,
      });
      router.push("/students");
    } catch { setError("Failed to create student"); }
    setLoading(false);
  };

  const fields = [
    { key: "name" as const, label: "Name *", sm: true, type: "text" },
    { key: "mobile" as const, label: "Mobile *", sm: true, type: "tel" },
    { key: "fatherName" as const, label: "Father's Name *", sm: true, type: "text" },
    { key: "motherName" as const, label: "Mother's Name", sm: true, type: "text" },
    { key: "joinDate" as const, label: "Join Date *", sm: true, type: "date" },
    { key: "expiryDate" as const, label: "Expiry Date *", sm: true, type: "date" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href="/students" className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-5 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      <div className="bg-surface rounded-2xl border border-border p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/25">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-text">Add New Student</h2>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-xl mb-5 text-sm animate-fade-in">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">{f.label}</label>
                <input type={f.type} required={f.label.includes("*")} value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" rows={2} />
          </div>

          <div className="border-t border-border pt-4 mt-2">
            <h3 className="text-sm font-semibold text-text mb-3">Seat Assignments (Optional)</h3>
            <div className="space-y-3">
              {assignments.map((a, idx) => (
                <div key={idx} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Slot {idx + 1} {usedSlotIds.filter((id) => id === a.timeSlotId).length > 1 ? "(duplicate)" : ""}
                    </label>
                    <select value={a.timeSlotId}
                      onChange={(e) => updateAssignment(idx, "timeSlotId", e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300">
                      <option value="">— Select Slot —</option>
                      {getAvailableSlots(idx).map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime}) — ₹{s.fee}/mo</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Seat</label>
                    <select value={a.seatId} disabled={!a.timeSlotId}
                      onChange={(e) => updateAssignment(idx, "seatId", e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 disabled:opacity-50">
                      <option value="">— Select Seat —</option>
                      {getAvailableSeats(a.timeSlotId, idx).map((s) => (
                        <option key={s.id} value={s.id}>Seat #{s.seatNumber}</option>
                      ))}
                    </select>
                  </div>
                  {assignments.length > 1 && (
                    <button type="button" onClick={() => removeAssignment(idx)}
                      className="p-2.5 mb-0.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addAssignment}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Another Slot
              </button>
            </div>
          </div>

          {totalSlotFee > 0 && (
            <div className="bg-hover/50 rounded-xl p-4 border border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Total Slot Fees</span>
                <span className="font-medium text-text">₹{totalSlotFee}/mo</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Discount</span>
                  <span className="font-medium text-success">- ₹{discount}/mo</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Net Monthly Fee</span>
                <span className="font-medium text-text">₹{netMonthly}/mo</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Duration</span>
                <span className="font-medium text-text">{totalMonths} month{totalMonths > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-text border-t border-border pt-1.5 mt-1.5">
                <span className="font-semibold">Total Due (after discount)</span>
                <span className="font-bold text-primary">₹{totalDue.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Initial Fee (₹)</label>
              <input type="number" min="0" value={form.feeAmount}
                onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
                placeholder={totalSlotFee > 0 ? `₹${totalSlotFee} (slot fee)` : "0"}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Discount (₹/mo)</label>
              <input type="number" min="0" value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Payment Mode</label>
              <div className="flex gap-2">
                {["CASH", "ONLINE"].map((mode) => (
                  <button key={mode} type="button" onClick={() => setForm({ ...form, paymentMode: mode })}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${
                      form.paymentMode === mode
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white border-primary shadow-lg shadow-primary/25"
                        : "bg-surface border-border text-text-secondary hover:border-primary"
                    }`}>{mode === "CASH" ? "💵 Cash" : "🏦 Online (A/C)"}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/students"
              className="inline-block px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-hover transition-all">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:from-primary-dark hover:to-primary disabled:opacity-50 transition-all duration-300 shadow-lg shadow-primary/25">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
