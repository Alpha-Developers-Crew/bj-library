"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";
import {
  Users, UserCheck, UserX, Armchair, IndianRupee,
  AlertTriangle, Clock, TrendingUp, UserPlus, RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalStudents: number; activeStudents: number; expiredStudents: number;
  totalSeats: number; occupiedSeats: number; availableSeats: number;
  monthlyCollection: number; pendingFees: number;
  upcomingExpiries: number; dueFeeStudents: number;
}

const cardColors = [
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-danger/15", icon: "text-danger" },
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-danger/15", icon: "text-danger" },
  { light: "bg-primary/15", icon: "text-primary" },
  { light: "bg-danger/15", icon: "text-danger" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-text-muted">Failed to load dashboard</div>;
  }

  const cards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users },
    { label: "Active Students", value: stats.activeStudents, icon: UserCheck },
    { label: "Expired Students", value: stats.expiredStudents, icon: UserX },
    { label: "Total Seats", value: stats.totalSeats, icon: Armchair },
    { label: "Occupied Seats", value: stats.occupiedSeats, icon: Armchair },
    { label: "Available Seats", value: stats.availableSeats, icon: Armchair },
    { label: "Monthly Collection", value: `₹${stats.monthlyCollection.toLocaleString()}`, icon: IndianRupee },
    { label: "Pending Fees", value: `₹${stats.pendingFees.toLocaleString()}`, icon: AlertTriangle },
    { label: "Upcoming Expiries", value: stats.upcomingExpiries, icon: Clock },
    { label: "Due Fee Students", value: stats.dueFeeStudents, icon: TrendingUp },
  ];

  const valueColor = (idx: number) => {
    if (idx === 2 || idx === 7) return "text-danger";
    if (idx === 1 || idx === 5 || idx === 6) return "text-primary";
    return "text-text-secondary";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <div key={card.label}
            className="group relative bg-surface rounded-2xl border border-border-light p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${cardColors[idx].light}`}>
                <card.icon className={`w-5 h-5 ${cardColors[idx].icon}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-text-muted">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${valueColor(idx)}`}>
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-border-light p-6">
        <h2 className="text-lg font-bold text-text-secondary mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/students/new", label: "Add Student", icon: UserPlus, bg: "bg-primary" },
            { href: "/seats", label: "Assign Seat", icon: Armchair, bg: "bg-primary-dark" },
            { href: "/renewals", label: "Renew Student", icon: RefreshCw, bg: "bg-primary" },
            { href: "/fees", label: "Record Payment", icon: IndianRupee, bg: "bg-primary" },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className="group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 hover:shadow-lg border border-border-light hover:border-transparent"
            >
              <div className={`p-3 rounded-xl ${action.bg} text-white shadow-lg`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-text-secondary group-hover:text-[#3A3A3A] transition-colors">{action.label}</span>
              <svg className="w-5 h-5 ml-auto text-primary group-hover:text-[#C9A66B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
