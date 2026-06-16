"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-6 sm:pt-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl shadow-2xl shadow-black/50 w-full ${maxWidth} max-h-[90vh] overflow-hidden border border-border`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-hover transition-colors text-text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-70px)] text-text">{children}</div>
      </div>
    </div>
  );
}
