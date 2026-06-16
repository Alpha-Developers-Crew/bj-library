"use client";

import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface HeaderProps { onMenuClick: () => void; title: string; }

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-header border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-hover transition-colors">
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-hover transition-colors hover:opacity-80"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-text-muted" />
          ) : (
            <Sun className="w-5 h-5 text-gold" />
          )}
        </button>
        <button className="p-2.5 rounded-xl bg-hover transition-colors relative">
          <Bell className="w-5 h-5 text-text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/25">
          A
        </div>
      </div>
    </header>
  );
}
