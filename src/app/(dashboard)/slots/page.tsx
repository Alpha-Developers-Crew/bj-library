"use client";

import { useEffect, useState } from "react";
import { getSlots, createSlot, updateSlot, deleteSlot } from "@/lib/actions/slots";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

interface SlotData { id: string; name: string; startTime: string; endTime: string; fee: number; assignments: { id: string; student: { name: string }; seat: { seatNumber: number } }[] }

export default function SlotsPage() {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", startTime: "", endTime: "", fee: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadSlots = async () => {
    setLoading(true);
    try { const data = await getSlots(); setSlots(data as SlotData[]); } catch {}
    setLoading(false);
  };
  useEffect(() => { loadSlots(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ name: "", startTime: "06:00", endTime: "10:00", fee: "" }); setShowModal(true); };
  const openEdit = (s: SlotData) => { setEditingId(s.id); setForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, fee: String(s.fee) }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, fee: parseFloat(form.fee) || 0 };
    if (editingId) await updateSlot(editingId, data);
    else await createSlot(data);
    setShowModal(false); loadSlots();
  };

  const handleDelete = async () => { if (!deleteId) return; await deleteSlot(deleteId); setDeleteId(null); loadSlots(); };

  const slotGradients = ["from-primary to-primary-dark", "from-primary-dark to-primary", "from-accent to-accent-dark", "from-gold to-gold-dark"];

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted"><span className="font-medium text-text-secondary">{slots.length}</span> time slot(s) configured</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slots.map((slot, idx) => (
          <div key={slot.id} className="bg-surface rounded-2xl border border-border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${slotGradients[idx % 4]} text-white shadow-lg`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(slot)} className="p-1.5 rounded-lg hover:bg-hover transition-colors">
                  <Pencil className="w-4 h-4 text-text-muted" />
                </button>
                <button onClick={() => setDeleteId(slot.id)} className="p-1.5 rounded-lg hover:bg-danger/15 transition-colors">
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-text">{slot.name}</h3>
            <p className="text-sm text-text-muted mb-3">{slot.startTime} — {slot.endTime}</p>
            <div className="text-2xl font-bold text-primary mb-3">₹{slot.fee}<span className="text-sm font-normal text-text-muted">/mo</span></div>
            <div className="text-sm text-text-muted">
              <span className="font-medium text-text-secondary">{slot.assignments.length}</span> seat(s) assigned
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Slot" : "Add Slot"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Slot Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Start *</label>
              <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">End *</label>
              <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Monthly Fee (₹) *</label>
            <input type="number" required min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover transition-all">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-text mb-2">Delete Slot</h3>
            <p className="text-text-muted mb-6">All seat assignments for this slot will also be removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-hover">Cancel</button>
              <button onClick={handleDelete}
                className="px-5 py-2.5 bg-gradient-to-r from-danger to-danger-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-danger/25 hover:from-danger-dark hover:to-danger-darker transition-all duration-300">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
