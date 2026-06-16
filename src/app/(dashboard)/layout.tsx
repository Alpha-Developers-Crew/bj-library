"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/seats": "Seat Management",
  "/slots": "Time Slots",
  "/fees": "Fee Management",
  "/renewals": "Renewals",
  "/due-fees": "Due Fees",
  "/reports": "Reports",
  "/import-export": "Import / Export",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const title = pageTitles[pathname || ""] || "BJ Library";

  return (
    <div className="min-h-screen bg-body">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
