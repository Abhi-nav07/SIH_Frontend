import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "SANKAT SETU — Disaster Operations",
    template: "%s | SANKAT SETU",
  },
  description: "An explainable alert-to-action disaster orchestration prototype for inter-agency response.",
  applicationName: "SANKAT SETU",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
