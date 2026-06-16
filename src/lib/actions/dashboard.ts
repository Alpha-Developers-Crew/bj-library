"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats() {
  await requireAdmin();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [totalStudents, activeStudents, seats, monthPayments, activeStudentsForFee, slotCount] =
    await Promise.all([
      prisma.student.count(),
      prisma.student.count({
        where: { activeStatus: true, expiryDate: { gte: now } },
      }),
      prisma.seat.findMany({
        include: {
          assignments: { include: { timeSlot: true } },
        },
      }),
      prisma.payment.findMany({
        where: { paymentDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.student.findMany({
        where: {
          activeStatus: true,
          expiryDate: { gte: now },
        },
        include: { assignments: { include: { timeSlot: true } } },
      }),
      prisma.timeSlot.count(),
    ]);

  const totalSeats = seats.length * slotCount;
  const occupiedSeats = seats.reduce((sum, s) => sum + s.assignments.length, 0);
  const monthlyCollection = monthPayments.reduce((sum, p) => sum + p.amount, 0);

  const thisMonthPaidByStudent = new Map<string, number>();
  for (const p of monthPayments) {
    const curr = thisMonthPaidByStudent.get(p.studentId) || 0;
    thisMonthPaidByStudent.set(p.studentId, curr + p.amount);
  }

  let pendingFees = 0;
  let dueFeeCount = 0;
  for (const student of activeStudentsForFee) {
    const monthlyFee = student.assignments.reduce(
      (sum, a) => sum + a.timeSlot.fee,
      0
    );
    if (monthlyFee === 0) continue;

    const thisMonthPaid = thisMonthPaidByStudent.get(student.id) || 0;
    const pending = Math.max(0, monthlyFee - thisMonthPaid);

    if (pending > 0) {
      pendingFees += pending;
      dueFeeCount++;
    }
  }

  const upcomingExpiryThreshold = new Date();
  upcomingExpiryThreshold.setDate(upcomingExpiryThreshold.getDate() + 7);
  const upcomingExpiries = await prisma.student.count({
    where: {
      activeStatus: true,
      expiryDate: { gte: now, lte: upcomingExpiryThreshold },
    },
  });

  const expiredStudents = await prisma.student.count({
    where: {
      OR: [
        { activeStatus: false },
        { expiryDate: { lt: now } },
      ],
    },
  });

  return {
    totalStudents,
    activeStudents,
    expiredStudents,
    totalSeats,
    occupiedSeats,
    availableSeats: totalSeats - occupiedSeats,
    monthlyCollection,
    pendingFees,
    upcomingExpiries,
    dueFeeStudents: dueFeeCount,
  };
}
