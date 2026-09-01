"use client";

import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { Tone } from "@/components/ui/Badge";

type ReadinessTone = "ok" | "warn" | "bad";

interface ReadinessRow {
  label: string;
  value: string;
  tone: ReadinessTone;
  meta?: string;
}

interface ReadinessPanelProps {
  title: string;
  rows: ReadinessRow[];
}

const toneToBadge: Record<ReadinessTone, Tone> = {
  ok: "success",
  warn: "warning",
  bad: "critical",
};

const toneClass: Record<ReadinessTone, string> = {
  ok: "text-emerald-400",
  warn: "text-orange-400",
  bad: "text-red-400",
};

const toneIcon: Record<ReadinessTone, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warn: Clock3,
  bad: AlertCircle,
};

export function ReadinessPanel({ title, rows }: ReadinessPanelProps) {
  // toneToBadge is available for future use but we keep the existing visual style
  void toneToBadge;

  return (
    <Card>
      <CardHeader className="border-b border-white/7 pb-4">
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </CardHeader>
      <CardBody className="space-y-1 pt-3">
        {rows.map((row) => {
          const Icon = toneIcon[row.tone];
          return (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-white/[0.025]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon size={15} className={toneClass[row.tone]} aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold text-slate-300">{row.label}</div>
                  {row.meta && <div className="mt-0.5 text-[10px] text-slate-600">{row.meta}</div>}
                </div>
              </div>
              <span
                className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${toneClass[row.tone]}`}
                role="status"
              >
                {row.value}
              </span>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
