"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSlots() {
  await requireAdmin();
  return prisma.timeSlot.findMany({
    include: {
      assignments: {
        include: {
          student: { select: { id: true, name: true } },
          seat: { select: { id: true, seatNumber: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createSlot(data: {
  name: string;
  startTime: string;
  endTime: string;
  fee: number;
}) {
  await requireAdmin();
  const slot = await prisma.timeSlot.create({ data });
  revalidatePath("/slots");
  revalidatePath("/dashboard");
  return slot;
}

export async function updateSlot(
  id: string,
  data: { name?: string; startTime?: string; endTime?: string; fee?: number }
) {
  await requireAdmin();
  const slot = await prisma.timeSlot.update({ where: { id }, data });
  revalidatePath("/slots");
  revalidatePath("/dashboard");
  return slot;
}

export async function deleteSlot(id: string) {
  await requireAdmin();
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath("/slots");
  revalidatePath("/dashboard");
}
