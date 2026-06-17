"use client";

import { useEffect, useState } from "react";
import { getStudentReport, StudentReportRow } from "@/lib/actions/reports";
import { getPayments } from "@/lib/actions/fees";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { Download, Printer, FileBarChart, Users, Armchair, IndianRupee } from "lucide-react";
import { format } from "date-fns";

interface PaymentData { id: string; amount: number; mode: string; paymentDate: Date; student: { name: string; mobile: string } }

const tabs = [
  { key: "students" as const, label: "Students", icon: Users },
  { key: "seats" as const, label: "Seats", icon: Armchair },
  { key: "fees" as const, label: "Fees", icon: IndianRupee },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<"students" | "seats" | "fees">("students");
  const [rows, setRows] = useState<StudentReportRow[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<{ totalStudents: number; activeStudents: number; expiredStudents: number; totalSeats: number; occupiedSeats: number; availableSeats: number; monthlyCollection: number; pendingFees: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [r, p, st] = await Promise.all([
          getStudentReport(), getPayments() as Promise<PaymentData[]>, getDashboardStats(),
        ]);
        setRows(r); setPayments(p); setStats(st);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const exportExcel = async () => {
    if (!rows.length) return;
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students Report");

    const headers = [
      "S.No", "Student's Name", "Father's Name", "Mobile No.",
      "Admission", "Expiry", "Seat", "Shift",
      "#Shifts", "Fee/Month", "Discount", "Total Due",
      "Cash", "Online", "Pending",
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => { cell.font = { bold: true }; });

    const dataRows: (string | number)[][] = rows.map((r) => [
      r.sNo, r.name, r.fatherName || "", r.mobile,
      format(r.joinDate, "dd/MM/yyyy"), format(r.expiryDate, "dd/MM/yyyy"),
      r.seatNumbers, r.shiftTimes, r.shiftCount,
      r.monthlyFee, r.discount, r.totalDue, r.cashPaid, r.onlinePaid, r.balanceAmount,
    ]);
    dataRows.forEach((row) => worksheet.addRow(row));

    const colCount = headers.length;
    for (let c = 1; c <= colCount; c++) {
      let max = 0;
      for (let r = 1; r <= worksheet.rowCount; r++) {
        const val = worksheet.getCell(r, c).value;
        const len = val ? String(val).length : 0;
        if (len > max) max = len;
      }
      worksheet.getColumn(c).width = max + 3;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `students-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    a.click();
  };

  const printTable = () => window.print();

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const paymentData = payments.map((p) => ({
    Student: p.student.name,
    Mobile: p.student.mobile,
    Mode: p.mode,
    Amount: p.amount,
    Date: format(new Date(p.paymentDate), "dd/MM/yyyy"),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              tab === t.key
                ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25"
                : "bg-surface border border-border text-text-secondary hover:border-primary"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label} Report
          </button>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active/Total Students", value: `${stats.activeStudents}/${stats.totalStudents}`, sub: "Students", color: "text-primary" },
            { label: "Occupied/Total Seats", value: `${stats.occupiedSeats}/${stats.totalSeats}`, sub: "Seats", color: "text-primary-dark" },
            { label: "Monthly Collection", value: `₹${stats.monthlyCollection.toLocaleString()}`, sub: "This month", color: "text-primary" },
            { label: "Pending Fees", value: `₹${stats.pendingFees.toLocaleString()}`, sub: "Outstanding", color: "text-danger" },
          ].map((item) => (
            <div key={item.label} className="bg-surface rounded-2xl p-5 border border-border text-center">
              <p className="text-sm text-text-muted">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
              <p className="text-xs text-text-muted mt-1">{item.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-text capitalize flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" /> {tab} Report
          </h3>
          <div className="flex gap-2">
            {tab === "students" && (
              <button onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300">
                <Download className="w-4 h-4" /> Excel
              </button>
            )}
            <button onClick={printTable}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-text-muted to-text-muted/80 text-white rounded-xl text-sm font-medium shadow-lg hover:opacity-90 transition-all duration-300">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {tab === "students" && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase w-10">S. no.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Student&apos;s Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Father&apos;s Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Mobile No.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Admission</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Expiry</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Seat</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase">Shift</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase">#Shifts</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase">Fee/Month</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase">Discount</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase">Total Due</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase">Cash</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase">Online</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.sNo} className="hover:bg-hover/50 transition-colors duration-150">
                    <td className="px-3 py-3 text-text-muted text-xs">{r.sNo}</td>
                    <td className="px-3 py-3 font-medium text-text">{r.name}</td>
                    <td className="px-3 py-3 text-text-secondary">{r.fatherName || "—"}</td>
                    <td className="px-3 py-3 text-text-muted">{r.mobile}</td>
                    <td className="px-3 py-3 text-text-secondary text-xs">{format(r.joinDate, "dd/MM/yy")}</td>
                    <td className="px-3 py-3 text-text-secondary text-xs">{format(r.expiryDate, "dd/MM/yy")}</td>
                    <td className="px-3 py-3 text-text-muted text-xs">{r.seatNumbers}</td>
                    <td className="px-3 py-3 text-text-muted text-xs">{r.shiftTimes}</td>
                    <td className="px-3 py-3 text-center text-text-secondary">{r.shiftCount}</td>
                    <td className="px-3 py-3 text-right font-medium text-text-secondary">₹{r.monthlyFee}</td>
                    <td className="px-3 py-3 text-right font-medium text-success">₹{r.discount}</td>
                    <td className="px-3 py-3 text-right font-medium text-text">₹{r.totalDue.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-success font-medium">₹{r.cashPaid.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-accent font-medium">₹{r.onlinePaid.toLocaleString()}</td>
                    <td className={`px-3 py-3 text-right font-bold ${r.balanceAmount > 0 ? "text-danger" : "text-text"}`}>
                      ₹{r.balanceAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="text-center py-8 text-text-muted">No students found</p>
            )}
          </div>
        )}

        {tab === "fees" && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Mode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {paymentData.map((p, i) => (
                  <tr key={i} className="hover:bg-hover/50 transition-colors duration-150">
                    <td className="px-4 py-3 font-medium text-text">{p.Student}</td>
                    <td className="px-4 py-3 text-text-muted">{p.Mobile}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.Mode}</td>
                    <td className="px-4 py-3 text-right text-primary font-bold">₹{p.Amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-muted">{p.Date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "seats" && stats && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-primary/10 rounded-xl border border-primary/30 text-center">
                <p className="text-3xl font-bold text-primary-dark">{stats.totalSeats}</p>
                <p className="text-sm text-primary-dark font-medium">Total Seats</p>
              </div>
              <div className="p-5 bg-warning/10 rounded-xl border border-warning/30 text-center">
                <p className="text-3xl font-bold text-warning">{stats.occupiedSeats}</p>
                <p className="text-sm text-warning font-medium">Occupied</p>
              </div>
              <div className="p-5 bg-success/10 rounded-xl border border-success/30 text-center">
                <p className="text-3xl font-bold text-success">{stats.availableSeats}</p>
                <p className="text-sm text-success font-medium">Available</p>
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div><span className="text-xs font-semibold text-text-muted">Occupancy</span></div>
                <div><span className="text-xs font-semibold text-primary">{Math.round((stats.occupiedSeats / stats.totalSeats) * 100)}%</span></div>
              </div>
              <div className="overflow-hidden h-3 rounded-full bg-border">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-1000 ease-out"
                  style={{ width: `${(stats.occupiedSeats / stats.totalSeats) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
