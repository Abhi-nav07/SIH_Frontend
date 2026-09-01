"use client";

import { ReactNode, createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./Badge";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────── */

interface ToastItem {
  id: string;
  message: string;
  tone: Tone;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, tone?: Tone, duration?: number) => void;
}

/* ─── Context ─────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ─── Icons ───────────────────────────────────────────────────────── */

const toneIcon: Record<Tone, ReactNode> = {
  neutral: <Info size={16} aria-hidden="true" />,
  info: <Info size={16} aria-hidden="true" />,
  success: <CheckCircle2 size={16} aria-hidden="true" />,
  warning: <TriangleAlert size={16} aria-hidden="true" />,
  critical: <XCircle size={16} aria-hidden="true" />,
};

const toneStyles: Record<Tone, string> = {
  neutral: "border-white/10 bg-[#0d1928] text-slate-200",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  critical: "border-red-500/30 bg-red-500/10 text-red-200",
};

/* ─── Provider ────────────────────────────────────────────────────── */

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: Tone = "neutral", duration = 3500) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((prev) => [...prev, { id, message, tone, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg",
              toneStyles[t.tone],
            )}
            style={{ animation: "toast-in 250ms ease-out" }}
            role="status"
          >
            {toneIcon[t.tone]}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
