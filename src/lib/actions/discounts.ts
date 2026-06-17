"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDiscounts(search?: string) {
  await requireAdmin();
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search } },
    ];
  }
  const students = await prisma.student.findMany({
    where,
    include: {
      assignments: { include: { timeSlot: { select: { fee: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return students.map((s) => ({
    id: s.id,
    name: s.name,
    mobile: s.mobile,
    fatherName: s.fatherName,
    discount: s.discount,
    monthlyFee: s.assignments.reduce((sum, a) => sum + a.timeSlot.fee, 0),
  }));
}

export async function updateDiscount(studentId: string, discount: number) {
  await requireAdmin();
  await prisma.student.update({
    where: { id: studentId },
    data: { discount },
  });
  revalidatePath("/discounts");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${studentId}`);
}
