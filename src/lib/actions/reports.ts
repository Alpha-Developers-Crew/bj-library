"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { differenceInCalendarMonths } from "date-fns";

export interface StudentReportRow {
  sNo: number;
  name: string;
  fatherName: string | null;
  mobile: string;
  joinDate: Date;
  expiryDate: Date;
  seatNumbers: string;
  shiftTimes: string;
  shiftCount: number;
  monthlyFee: number;
  discount: number;
  totalDue: number;
  cashPaid: number;
  onlinePaid: number;
  balanceAmount: number;
}

export async function getStudentReport(): Promise<StudentReportRow[]> {
  await requireAdmin();

  const students = await prisma.student.findMany({
    include: {
      assignments: {
        include: { seat: true, timeSlot: true },
      },
      payments: true,
    },
    orderBy: { name: "asc" },
  });

  return students.map((s, idx) => {
    const monthlyFee = s.assignments.reduce((sum, a) => sum + a.timeSlot.fee, 0);
    const discount = s.discount || 0;
    const netMonthly = Math.max(0, monthlyFee - discount);
    const seatNumbers = s.assignments.map((a) => `#${a.seat.seatNumber}`).join(", ");
    const shiftTimes = s.assignments.map((a) => a.timeSlot.name).join(", ");
    const shiftCount = s.assignments.length;

    const monthsInPeriod = Math.max(1, differenceInCalendarMonths(s.expiryDate, s.joinDate));
    const totalDue = netMonthly * monthsInPeriod;

    let cashPaid = 0;
    let onlinePaid = 0;
    for (const p of s.payments) {
      if (p.mode === "ONLINE") onlinePaid += p.amount;
      else cashPaid += p.amount;
    }

    const totalPaid = cashPaid + onlinePaid;

    return {
      sNo: idx + 1,
      name: s.name,
      fatherName: s.fatherName,
      mobile: s.mobile,
      joinDate: s.joinDate,
      expiryDate: s.expiryDate,
      seatNumbers: seatNumbers || "—",
      shiftTimes: shiftTimes || "—",
      shiftCount,
      monthlyFee,
      discount,
      totalDue,
      cashPaid,
      onlinePaid,
      balanceAmount: totalDue - totalPaid,
    };
  });
}
