"use client";

import { useEffect, useState } from "react";
import { getStudents } from "@/lib/actions/students";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { isBefore, differenceInDays, format } from "date-fns";

interface StudentData {
  id: string; name: string; mobile: string; expiryDate: Date; activeStatus: boolean;
  assignments: { timeSlot: { fee: number } }[]; payments: { amount: number }[];
}

const tabs = [
  { key: "overdue" as const, label: "Overdue", color: "from-red-500 to-red-600" },
  { key: "upcoming" as const, label: "Upcoming Expiry", color: "from-amber-500 to-amber-600" },
  { key: "pending" as const, label: "Pending Fees", color: "from-primary to-primary-dark" },
];

export default function DueFeesPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overdue" | "upcoming" | "pending">("overdue");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setStudents(await getStudents() as StudentData[]); } catch {}
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const upcomingThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const lists = {
    overdue: students.filter((s) => isBefore(new Date(s.expiryDate), now) || !s.activeStatus),
    upcoming: students.filter((s) => { const e = new Date(s.expiryDate); return !isBefore(e, now) && isBefore(e, upcomingThreshold); }),
    pending: students.filter((s) => {
      const fee = s.assignments.reduce((sum, a) => sum + a.timeSlot.fee, 0);
      const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
      return fee > 0 && paid < fee && s.activeStatus && !isBefore(new Date(s.expiryDate), now);
    }),
  };
  const currentList = lists[tab];

  const getDaysText = (expiryDate: Date) => {
    const days = differenceInDays(new Date(expiryDate), now);
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return "Today";
    return `${days} days left`;
  };

  const getFeeStatus = (s: StudentData) => {
    const fee = s.assignments.reduce((sum, a) => sum + a.timeSlot.fee, 0);
    const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, fee - paid);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? `bg-gradient-to-r ${t.color} text-white shadow-lg`
                : "bg-surface border border-border text-text-secondary hover:border-indigo-300"
            }`}
          >
            {t.label} ({lists[t.key].length})
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        {currentList.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p>No students in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Mobile</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentList.map((s) => {
                  const pending = getFeeStatus(s);
                  return (
                    <tr key={s.id} className="hover:bg-hover/50 transition-colors duration-150">
                      <td className="px-4 py-3.5">
                        <Link href={`/students/${s.id}`} className="font-medium text-primary hover:text-indigo-800 transition-colors">{s.name}</Link>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{s.mobile}</td>
                      <td className="px-4 py-3.5">
                        <span className={tab === "overdue" ? "text-danger font-medium" : "text-text-secondary"}>
                          {format(new Date(s.expiryDate), "dd MMM yyyy")}
                        </span>
                        <span className={`text-xs ml-2 ${tab === "overdue" ? "text-red-400" : "text-amber-400"}`}>
                          {getDaysText(s.expiryDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {tab === "pending" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                            ₹{pending.toLocaleString()} due
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-danger/15 text-red-700 border border-red-200 text-xs font-semibold">Expired</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/students/${s.id}`} className="text-primary hover:text-indigo-800 text-sm font-medium transition-colors">View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
