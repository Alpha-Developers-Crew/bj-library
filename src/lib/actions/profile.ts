"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  const admin = await requireAdmin();
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    securityQuestion: admin.securityQuestion,
    hasSecurityQuestion: !!admin.securityQuestion,
  };
}

export async function updateProfile(data: { name: string }) {
  const admin = await requireAdmin();
  await prisma.admin.update({
    where: { id: admin.id },
    data: { name: data.name },
  });
  revalidatePath("/profile");
  return { success: true };
}

export async function setSecurityQuestion(data: { question: string; answer: string }) {
  const admin = await requireAdmin();
  if (!data.question.trim() || !data.answer.trim()) {
    return { error: "Question and answer are required" };
  }
  if (data.answer.length < 3) {
    return { error: "Answer must be at least 3 characters" };
  }
  await prisma.admin.update({
    where: { id: admin.id },
    data: { securityQuestion: data.question.trim(), securityAnswer: data.answer.trim().toLowerCase() },
  });
  revalidatePath("/profile");
  return { success: true };
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  const admin = await requireAdmin();

  const isValid = await verifyPassword(data.oldPassword, admin.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  if (data.newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  const hashed = await hashPassword(data.newPassword);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { password: hashed },
  });

  return { success: true };
}
