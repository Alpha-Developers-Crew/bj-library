"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getStudents(search?: string, status?: string) {
  await requireAdmin();
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search } },
      { fatherName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "active") {
    where.activeStatus = true;
    where.expiryDate = { gte: new Date() };
  } else if (status === "expired") {
    where.OR = [
      { activeStatus: false },
      { expiryDate: { lt: new Date() } },
    ];
  }
  return prisma.student.findMany({
    where,
    include: {
      assignments: {
        include: { seat: true, timeSlot: true },
      },
      payments: { orderBy: { paymentDate: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudent(id: string) {
  await requireAdmin();
  return prisma.student.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { seat: true, timeSlot: true },
        orderBy: { assignmentDate: "desc" },
      },
      payments: { orderBy: { paymentDate: "desc" } },
      renewals: { orderBy: { renewalDate: "desc" } },
    },
  });
}

export async function createStudent(data: {
  name: string;
  mobile: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  joinDate?: string;
  expiryDate: string;
}) {
  await requireAdmin();
  const student = await prisma.student.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      address: data.address,
      fatherName: data.fatherName,
      motherName: data.motherName,
      joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
      expiryDate: new Date(data.expiryDate),
    },
  });
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return student;
}

export async function updateStudent(
  id: string,
  data: {
    name?: string;
    mobile?: string;
    address?: string;
    fatherName?: string;
    motherName?: string;
    expiryDate?: string;
    activeStatus?: boolean;
  }
) {
  await requireAdmin();
  const student = await prisma.student.update({
    where: { id },
    data: {
      ...data,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/dashboard");
  return student;
}

export async function createStudentWithSeatAndFee(data: {
  name: string;
  mobile: string;
  address?: string;
  fatherName: string;
  motherName?: string;
  joinDate?: string;
  expiryDate: string;
  assignments?: { seatId: string; timeSlotId: string }[];
  feeAmount?: number;
  paymentMode?: string;
  discount?: number;
}) {
  await requireAdmin();
  if (!data.fatherName) throw new Error("Father's name is required");
  const student = await prisma.student.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      address: data.address,
      fatherName: data.fatherName,
      motherName: data.motherName,
      discount: data.discount ?? 0,
      joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
      expiryDate: new Date(data.expiryDate),
    },
  });

  if (data.assignments && data.assignments.length > 0) {
    for (const a of data.assignments) {
      if (!a.seatId || !a.timeSlotId) continue;
      const existing = await prisma.studentAssignment.findUnique({
        where: { seatId_timeSlotId: { seatId: a.seatId, timeSlotId: a.timeSlotId } },
      });
      if (!existing) {
        await prisma.studentAssignment.create({
          data: { studentId: student.id, seatId: a.seatId, timeSlotId: a.timeSlotId },
        });
      }
    }
  }

  if (data.feeAmount && data.feeAmount > 0) {
    await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: data.feeAmount,
        mode: data.paymentMode || "CASH",
        notes: "Initial fee at registration",
      },
    });
  }

  revalidatePath("/students");
  revalidatePath("/seats");
  revalidatePath("/dashboard");
  return student;
}

export async function deleteStudent(id: string) {
  await requireAdmin();
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
  revalidatePath("/dashboard");
}

export async function importStudents(students: Array<{
  name: string;
  mobile: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  joinDate?: string;
  expiryDate: string;
}>) {
  await requireAdmin();
  let imported = 0;
  for (const s of students) {
    try {
      await prisma.student.create({
        data: {
          name: s.name,
          mobile: s.mobile,
          address: s.address,
          fatherName: s.fatherName,
          motherName: s.motherName,
          joinDate: s.joinDate ? new Date(s.joinDate) : new Date(),
          expiryDate: new Date(s.expiryDate),
        },
      });
      imported++;
    } catch {
      continue;
    }
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { imported };
}
