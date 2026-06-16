"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPayments(studentId?: string) {
  await requireAdmin();
  const where = studentId ? { studentId } : {};
  return prisma.payment.findMany({
    where,
    include: { student: { select: { id: true, name: true, mobile: true } } },
    orderBy: { paymentDate: "desc" },
  });
}

export async function addPayment(data: {
  studentId: string;
  amount: number;
  mode?: string;
  notes?: string;
}) {
  await requireAdmin();
  const payment = await prisma.payment.create({
    data: {
      studentId: data.studentId,
      amount: data.amount,
      mode: data.mode || "CASH",
      notes: data.notes,
    },
  });
  revalidatePath("/fees");
  revalidatePath(`/students/${data.studentId}`);
  revalidatePath("/dashboard");
  return payment;
}

export async function getStudentFeeSummary(studentId: string) {
  await requireAdmin();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      assignments: { include: { timeSlot: true } },
      payments: true,
    },
  });
  if (!student) return null;

  const monthlyFee = student.assignments.reduce(
    (sum, a) => sum + a.timeSlot.fee,
    0
  );
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(0, monthlyFee - totalPaid);

  return {
    student,
    monthlyFee,
    totalPaid,
    pendingAmount,
  };
}
