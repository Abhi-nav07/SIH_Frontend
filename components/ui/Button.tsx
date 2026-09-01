"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-orange-500 text-slate-950 shadow-lg shadow-orange-950/20 hover:bg-orange-400 active:translate-y-px",
  secondary: "border border-white/10 bg-white/[0.055] text-slate-100 hover:bg-white/[0.09]",
  danger: "border border-red-500/30 bg-red-500/12 text-red-200 hover:bg-red-500/20",
  success: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
  ghost: "bg-transparent text-slate-300 hover:bg-white/[0.055]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs gap-1.5",
  md: "min-h-11 px-4 py-2.5 text-sm gap-2",
  lg: "min-h-12 px-5 py-3 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", loading = false, className, disabled, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f]",
          "disabled:cursor-not-allowed disabled:opacity-45",
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
