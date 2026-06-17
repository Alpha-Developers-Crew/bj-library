"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createStudentWithSeatAndFee } from "@/lib/actions/students";
import { getSlots } from "@/lib/actions/slots";
import { getSeats } from "@/lib/actions/seats";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { addMonths, format } from "date-fns";

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
    timeSlotId: "", seatId: "", feeAmount: "", paymentMode: "CASH", discount: "",
  });

  useEffect(() => {
    Promise.all([getSlots(), getSeats()]).then(([s, se]) => {
      setSlots(s as Slot[]);
      setSeats(se as Seat[]);
    });
  }, []);

  const selectedSlot = slots.find((s) => s.id === form.timeSlotId);
  const takenSeatIds = selectedSlot
    ? new Set(selectedSlot.assignments.map((a) => a.seat.id))
    : new Set<string>();
  const availableSeats = form.timeSlotId
    ? seats.filter((s) => !takenSeatIds.has(s.id))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await createStudentWithSeatAndFee({
        name: form.name, mobile: form.mobile, address: form.address,
        fatherName: form.fatherName, motherName: form.motherName,
        joinDate: form.joinDate, expiryDate: form.expiryDate,
        seatId: form.seatId || undefined,
        timeSlotId: form.timeSlotId || undefined,
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
            <h3 className="text-sm font-semibold text-text mb-3">Seat Assignment (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Time Slot</label>
                <select value={form.timeSlotId}
                  onChange={(e) => { setForm({ ...form, timeSlotId: e.target.value, seatId: "", feeAmount: "" }); }}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300">
                  <option value="">— Select Slot —</option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime}) — ₹{s.fee}/mo</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Seat</label>
                <select value={form.seatId} disabled={!form.timeSlotId}
                  onChange={(e) => setForm({ ...form, seatId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 disabled:opacity-50">
                  <option value="">— Select Seat —</option>
                  {availableSeats.map((s) => (
                    <option key={s.id} value={s.id}>Seat #{s.seatNumber}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Initial Fee (₹)</label>
              <input type="number" min="0" value={form.feeAmount}
                onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
                placeholder={selectedSlot ? `₹${selectedSlot.fee} (slot fee)` : "0"}
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
