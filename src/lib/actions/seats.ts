"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSeats() {
  await requireAdmin();
  return prisma.seat.findMany({
    include: {
      assignments: {
        include: {
          student: { select: { id: true, name: true } },
          timeSlot: { select: { id: true, name: true, startTime: true, endTime: true } },
        },
      },
    },
    orderBy: { seatNumber: "asc" },
  });
}

export async function updateSeatCount(count: number) {
  await requireAdmin();
  const currentSeats = await prisma.seat.findMany({
    orderBy: { seatNumber: "asc" },
  });
  const currentCount = currentSeats.length;

  if (count > currentCount) {
    const maxNum = currentCount > 0 ? Math.max(...currentSeats.map((s) => s.seatNumber)) : 0;
    const newSeats = [];
    for (let i = 1; i <= count - currentCount; i++) {
      newSeats.push({ seatNumber: maxNum + i });
    }
    await prisma.seat.createMany({ data: newSeats });
  } else if (count < currentCount) {
    const seatsToRemove = currentSeats.slice(count);
    const idsToRemove = seatsToRemove.map((s) => s.id);
    await prisma.studentAssignment.deleteMany({
      where: { seatId: { in: idsToRemove } },
    });
    await prisma.seat.deleteMany({
      where: { id: { in: idsToRemove } },
    });
  }
  revalidatePath("/seats");
  revalidatePath("/dashboard");
}

export async function assignSeat(data: {
  studentId: string;
  seatId: string;
  timeSlotId: string;
}) {
  await requireAdmin();
  const existing = await prisma.studentAssignment.findUnique({
    where: { seatId_timeSlotId: { seatId: data.seatId, timeSlotId: data.timeSlotId } },
  });
  if (existing) {
    return { error: "This seat is already assigned for this time slot" };
  }
  const assignment = await prisma.studentAssignment.create({
    data: {
      studentId: data.studentId,
      seatId: data.seatId,
      timeSlotId: data.timeSlotId,
    },
    include: { student: true, seat: true, timeSlot: true },
  });
  revalidatePath("/seats");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${data.studentId}`);
  return { success: true, assignment };
}

export async function removeAssignment(id: string) {
  await requireAdmin();
  const assignment = await prisma.studentAssignment.findUnique({ where: { id } });
  await prisma.studentAssignment.delete({ where: { id } });
  revalidatePath("/seats");
  revalidatePath("/dashboard");
  if (assignment) {
    revalidatePath(`/students/${assignment.studentId}`);
  }
}
