"use client";

import { Info, Satellite, Database, User, ShieldCheck, ShieldAlert } from "lucide-react";
import { DataFreshness } from "@/lib/scenario/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProvenanceTagProps {
  source: string;
  sourceType: "satellite" | "sensor" | "human" | "system";
  observedAt: string; // e.g., "T-15m" or exercise timestamp
  confidence: number; // 0-100
  freshness: DataFreshness;
  isSimulated: boolean;
}

export function ProvenanceTag({
  source,
  sourceType,
  observedAt,
  confidence,
  freshness,
  isSimulated
}: ProvenanceTagProps) {
  const [open, setOpen] = useState(false);

  const getFreshnessColor = (f: DataFreshness) => {
    if (f === "current") return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (f === "ageing") return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (f === "stale") return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-slate-500 bg-slate-500/10 border-slate-500/20";
  };

  const SourceIcon = sourceType === "satellite" ? Satellite :
                     sourceType === "human" ? User :
                     sourceType === "sensor" ? Database : Info;

  return (
    <div className="relative inline-block">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-white/5",
          getFreshnessColor(freshness)
        )}
      >
        <SourceIcon size={10} />
        {freshness}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-56 z-50 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Provenance</span>
            {isSimulated && <span className="rounded bg-red-500/10 px-1 py-0.5 text-[8px] font-black text-red-400">SIMULATED</span>}
          </div>
          <div className="mt-2 space-y-2 text-xs">
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-slate-500">Source:</span>
              <span className="font-medium text-slate-200">{source}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-slate-500">Observed:</span>
              <span className="font-mono text-slate-300">{observedAt}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-slate-500">Freshness:</span>
              <span className={cn("font-bold capitalize", getFreshnessColor(freshness).split(' ')[0])}>{freshness}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-slate-500">Confidence:</span>
              <span className="flex items-center gap-1 text-slate-300">
                {confidence >= 80 ? <ShieldCheck size={12} className="text-emerald-400" /> : <ShieldAlert size={12} className="text-orange-400" />}
                {confidence}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
