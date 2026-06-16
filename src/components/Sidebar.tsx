"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Armchair, Clock, IndianRupee,
  RefreshCw, AlertTriangle, FileBarChart, LogOut, X, Library, User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/seats", label: "Seats", icon: Armchair },
  { href: "/slots", label: "Time Slots", icon: Clock },
  { href: "/fees", label: "Fees", icon: IndianRupee },
  { href: "/renewals", label: "Renewals", icon: RefreshCw },
  { href: "/due-fees", label: "Due Fees", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-dvh w-64 bg-sidebar flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl shadow-black/50`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/30">
              <Library className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-white">BJ Library</span>
          </div>
          <button onClick={onClose}
            className="lg:hidden text-text-muted hover:text-white p-1 rounded-lg hover:bg-border transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 min-h-0 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? "text-white bg-primary/15 border border-primary/25"
                    : "text-text-muted hover:text-white hover:bg-hover"
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                  isActive ? "text-primary" : "group-hover:text-primary"
                }`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border flex-shrink-0 space-y-1">
          <Link href="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-white hover:bg-hover transition-all duration-200 w-full group">
            <User className="w-5 h-5 group-hover:text-primary transition-colors" />
            Profile
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/15 transition-all duration-200 w-full group">
              <LogOut className="w-5 h-5 group-hover:text-danger transition-colors" />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
