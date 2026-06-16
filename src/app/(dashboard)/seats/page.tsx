"use client";

import { useEffect, useState } from "react";
import { getSeats, updateSeatCount, assignSeat, removeAssignment } from "@/lib/actions/seats";
import { getSlots } from "@/lib/actions/slots";
import { getStudents } from "@/lib/actions/students";
import Modal from "@/components/Modal";
import { Plus, Settings, X } from "lucide-react";

interface SeatData { id: string; seatNumber: number; assignments: { id: string; student: { id: string; name: string }; timeSlot: { id: string; name: string; startTime: string; endTime: string } }[] }
interface SlotData { id: string; name: string; startTime: string; endTime: string; fee: number }
interface StudentData { id: string; name: string }

const slotColors = [
  { dot: "bg-primary", ring: "ring-primary", light: "bg-primary/20", text: "text-primary", border: "border-primary/30", label: "bg-primary" },
  { dot: "bg-primary-dark", ring: "ring-primary-dark", light: "bg-primary-dark/20", text: "text-primary-dark", border: "border-primary-dark/30", label: "bg-primary-dark" },
  { dot: "bg-accent", ring: "ring-accent", light: "bg-accent/20", text: "text-accent", border: "border-accent/30", label: "bg-accent" },
  { dot: "bg-gold", ring: "ring-gold", light: "bg-gold/20", text: "text-gold", border: "border-gold/30", label: "bg-gold" },
];

function Dot({ filled, color }: { filled: boolean; color: string }) {
  return (
    <div className={`w-3 h-3 rounded-full transition-all duration-200 ${filled ? color : "bg-surface border-2 border-border"}`} />
  );
}

export default function SeatsPage() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatCount, setSeatCount] = useState(50);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: "", seatId: "", timeSlotId: "" });
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, sl, st] = await Promise.all([
        getSeats() as Promise<SeatData[]>, getSlots() as Promise<SlotData[]>, getStudents() as Promise<StudentData[]>,
      ]);
      setSeats(s); setSlots(sl); setStudents(st); setSeatCount(s.length || 50);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSeatCountChange = async () => {
    await updateSeatCount(seatCount);
    setShowSettings(false); loadData();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await assignSeat(assignForm);
    if (result?.error) { alert(result.error); return; }
    setShowAssignModal(false); setAssignForm({ studentId: "", seatId: "", timeSlotId: "" }); loadData();
  };

  const getAssignmentForSlot = (seat: SeatData, slotId: string) =>
    seat.assignments.find((a) => a.timeSlot.id === slotId);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-secondary hover:border-indigo-300 hover:text-primary transition-all">
            <Settings className="w-4 h-4" /> Configure ({seatCount} seats / {seatCount * 4} capacity)
          </button>
        </div>
        <button onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300">
          <Plus className="w-4 h-4" /> Assign Seat
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Legend:</span>
          {slots.map((slot, idx) => (
            <span key={slot.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${slotColors[idx % 4].light} ${slotColors[idx % 4].text} border ${slotColors[idx % 4].border}`}>
              <span className={`w-2 h-2 rounded-full ${slotColors[idx % 4].dot}`} />
              {slot.name}
            </span>
          ))}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-text-muted border border-border">
            <span className="w-2 h-2 rounded-full bg-surface border border-slate-300" /> Empty
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {seats.map((seat) => {
            const isHovered = hoveredSeat === seat.id;
            return (
              <div
                key={seat.id}
                className="group relative"
                onMouseEnter={() => setHoveredSeat(seat.id)}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <div className={`bg-surface rounded-xl border transition-all duration-200 p-2 flex flex-col items-center gap-1.5 cursor-default ${
                  isHovered ? "border-indigo-300 shadow-md shadow-indigo-500/10 -translate-y-0.5" : "border-border hover:border-slate-300"
                }`}>
                  <span className="text-xs font-bold text-text">#{seat.seatNumber}</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {slots.slice(0, 4).map((slot, idx) => {
                      const assignment = getAssignmentForSlot(seat, slot.id);
                      return <Dot key={slot.id} filled={!!assignment} color={slotColors[idx % 4].dot} />;
                    })}
                  </div>
                </div>

                {isHovered && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-56">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface border-t border-l border-border rotate-45" />
                    <div className="bg-surface rounded-xl border border-border shadow-xl p-3">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                        <span className="text-sm font-bold text-text">Seat #{seat.seatNumber}</span>
                        <button onClick={() => setHoveredSeat(null)} className="text-slate-300 hover:text-text-muted transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {slots.slice(0, 4).map((slot, idx) => {
                          const assignment = getAssignmentForSlot(seat, slot.id);
                          return (
                            <div key={slot.id} className="flex items-center gap-2">
                              <Dot filled={!!assignment} color={slotColors[idx % 4].dot} />
                              <span className={`text-xs font-medium min-w-[60px] ${slotColors[idx % 4].text}`}>
                                {slot.name}
                              </span>
                              <span className="text-xs text-text-muted">·</span>
                              {assignment ? (
                                <span className="text-xs font-semibold text-text truncate">{assignment.student.name}</span>
                              ) : (
                                <span className="text-xs text-text-muted">Empty</span>
                              )}
                              {assignment && (
                                <button
                                  onClick={async () => { await removeAssignment(assignment.id); loadData(); }}
                                  className="ml-auto text-red-300 hover:text-danger transition-colors flex-shrink-0"
                                  title="Remove assignment"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Seat">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Student *</label>
            <select required value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Time Slot *</label>
            <select required value={assignForm.timeSlotId} onChange={(e) => setAssignForm({ ...assignForm, timeSlotId: e.target.value, seatId: "" })}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300">
              <option value="">Select slot</option>
              {slots.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>)}
            </select>
          </div>
          {assignForm.timeSlotId && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Seat *</label>
              <select required value={assignForm.seatId} onChange={(e) => setAssignForm({ ...assignForm, seatId: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300">
                <option value="">Select seat</option>
                {seats.filter((s) => !s.assignments.some((a) => a.timeSlot.id === assignForm.timeSlotId)).map((s) => (
                  <option key={s.id} value={s.id}>Seat {s.seatNumber}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-all">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300">Assign</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Seat Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Total Seats</label>
            <input type="number" min={1} max={500} value={seatCount}
              onChange={(e) => setSeatCount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300" />
            <p className="text-xs text-text-muted mt-1.5">WARNING: Decreasing seat count will remove seats starting from the highest number.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowSettings(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-all">Cancel</button>
            <button onClick={handleSeatCountChange}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
