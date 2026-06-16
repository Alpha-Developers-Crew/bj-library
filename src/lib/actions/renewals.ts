"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";

export async function renewStudent(studentId: string, months: number = 1) {
  await requireAdmin();
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  const previousExpiry = student.expiryDate;
  const baseDate = previousExpiry > new Date() ? previousExpiry : new Date();
  const newExpiry = addMonths(baseDate, months);

  await prisma.student.update({
    where: { id: studentId },
    data: { expiryDate: newExpiry, activeStatus: true },
  });

  await prisma.renewal.create({
    data: {
      studentId,
      previousExpiry,
      newExpiry,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/renewals");
  revalidatePath("/dashboard");
  return { success: true, newExpiry };
}

export async function getRenewals() {
  await requireAdmin();
  return prisma.renewal.findMany({
    include: { student: { select: { id: true, name: true, mobile: true } } },
    orderBy: { renewalDate: "desc" },
  });
}

export async function setCustomExpiry(studentId: string, expiryDate: string) {
  await requireAdmin();
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  const previousExpiry = student.expiryDate;
  const newExpiry = new Date(expiryDate);

  await prisma.student.update({
    where: { id: studentId },
    data: { expiryDate: newExpiry, activeStatus: true },
  });

  await prisma.renewal.create({
    data: {
      studentId,
      previousExpiry,
      newExpiry,
      notes: "Custom expiry set",
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/renewals");
  return { success: true };
}
