"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const failedAttempts = new Map<string, { count: number; blockedUntil: number }>();

function checkRateLimit(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return true;
  if (Date.now() < record.blockedUntil) {
    return false;
  }
  if (Date.now() >= record.blockedUntil) {
    failedAttempts.delete(ip);
    return true;
  }
  return true;
}

function recordFailedAttempt(ip: string) {
  const record = failedAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  record.count++;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 60 * 1000;
  }
  failedAttempts.set(ip, record);
}

function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}

export async function login(username: string, password: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";

  if (!checkRateLimit(ip)) {
    return { error: "Too many attempts. Try again after 1 minute." };
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    recordFailedAttempt(ip);
    return { error: "Invalid username or password" };
  }
  const isValid = await verifyPassword(password, admin.password);
  if (!isValid) {
    recordFailedAttempt(ip);
    return { error: "Invalid username or password" };
  }

  clearFailedAttempts(ip);

  const token = generateToken({ adminId: admin.id, username: admin.username });
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}

export async function getSecurityQuestion(username: string) {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !admin.securityQuestion) {
    return { question: null };
  }
  return { question: admin.securityQuestion };
}

export async function resetPasswordWithQuestion(data: { username: string; answer: string }) {
  const admin = await prisma.admin.findUnique({ where: { username: data.username } });
  if (!admin || !admin.securityAnswer) {
    return { error: "No security question found for this admin" };
  }
  if (data.answer.trim().toLowerCase() !== admin.securityAnswer) {
    return { error: "Incorrect answer" };
  }

  const hashed = await hashPassword("admin123");
  await prisma.admin.update({
    where: { id: admin.id },
    data: { password: hashed },
  });

  return { success: true, message: "Password reset to admin/admin123" };
}

export async function setupAdmin() {
  const existingAdmin = await prisma.admin.findFirst();
  if (existingAdmin) {
    return { message: "Admin already exists" };
  }
  const hashedPassword = await hashPassword("admin123");
  await prisma.admin.create({
    data: {
      username: "admin",
      password: hashedPassword,
      name: "Library Admin",
    },
  });
  return { message: "Admin created successfully (username: admin, password: admin123)" };
}
