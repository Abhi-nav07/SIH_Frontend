"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Bot, CheckCircle2, GitBranch, Sparkles, TriangleAlert } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RISK_WEIGHTS } from "@/lib/scenario/risk";
import { cn } from "@/lib/utils";
import { CommandBrief } from "@/components/intelligence/CommandBrief";

export function DecisionPanel() {
  const phase = useScenarioStore((state) => state.phase);
  const actions = useScenarioStore((state) => state.actions);
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);
  const failBridge = useScenarioStore((state) => state.failBridge);
  const villages = useScenarioStore((state) => state.villages);
  const edges = useScenarioStore((state) => state.edges);

  const [detailsOpen, setDetailsOpen] = useState(false);

  // liveActions are proposed or confirmed, not superseded or rejected
  const liveActions = actions.filter((action) => action.status === "proposed" || action.status === "confirmed").sort((a, b) => b.riskScore - a.riskScore);
  const supersededActions = actions.filter(action => action.status === "superseded");
  
  const top = liveActions[0];
  const derivedConfidence = top ? Math.min(99, Math.round(top.riskScore * 100) + 15) : 0;

  const handleSimulateFailure = () => {
    if (confirm("Exercise Controller: Confirm trigger of Bridge-3 failure simulation?")) {
      failBridge();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {phase !== "idle" && <CommandBrief villages={villages} edges={edges} />}
      
      <Card className="h-fit overflow-hidden">
        <CardHeader className="items-center border-b border-white/7 pb-4">
          <SectionHeader
            title="Decision engine"
            description="Auditable priority logic · v0.4"
            icon={<Bot size={18} aria-hidden="true" />}
          />
        </CardHeader>
        <CardBody className="pt-4">
          {phase === "idle" || !top ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center">
              <Sparkles className="mx-auto text-slate-600" size={24} aria-hidden="true" />
              <div className="mt-3 text-sm font-semibold text-slate-300">No recommendation yet</div>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                Start the exercise to fuse the alert, exposure and route data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={cn("rounded-xl border p-4", top.status === "confirmed" ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] to-emerald-500/[0.04]" : "border-slate-700 bg-white/[0.02]")}>
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={top.status === "confirmed" ? "success" : "neutral"}>
                    {top.status === "confirmed" ? "Confirmed Action" : "Proposed Action"}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-slate-300" aria-label={`Risk score: ${Math.round(top.riskScore * 100)} out of 100`}>
                    {Math.round(top.riskScore * 100)}/100
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight text-white">{top.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-300">{top.reason}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-black/15 p-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Decision window</div>
                    <div className="mt-1 text-sm font-bold text-white">{top.windowMinutes} min</div>
                  </div>
                  <div className="rounded-lg bg-black/15 p-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Confidence</div>
                    <div className="mt-1 text-sm font-bold text-white">{derivedConfidence}%</div>
                  </div>
                </div>
              </div>

              {supersededActions.length > 0 && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.08] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Plan Changed</div>
                  <div className="mt-1.5 text-xs font-medium text-orange-200">
                    Previous action &ldquo;{supersededActions[0].title}&rdquo; was superseded due to Bridge-3 failure. New tasks generated.
                  </div>
                </div>
              )}

              {liveActions.slice(1, 3).map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/7 bg-white/[0.025] p-3"
                >
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Priority {index + 2}</div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-slate-300">{action.title}</div>
                  </div>
                  <Badge tone="warning">{Math.round(action.riskScore * 100)}</Badge>
                </div>
              ))}

              <div className="rounded-xl border border-white/7 bg-white/[0.025] p-3">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  aria-expanded={detailsOpen}
                  aria-controls="decision-weights"
                  className="flex w-full items-center justify-between text-xs font-bold text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <span className="flex items-center gap-2">
                    <GitBranch size={14} className="text-cyan-400" aria-hidden="true" /> Why this action?
                  </span>
                  <span className={cn("text-slate-600 transition-transform", detailsOpen && "rotate-45")} aria-hidden="true">
                    +
                  </span>
                </button>
                
                {detailsOpen && (
                  <div id="decision-weights" className="mt-3 space-y-2 border-t border-white/7 pt-3 text-[11px] text-slate-500">
                    {Object.entries(RISK_WEIGHTS).map(([label, weight]) => (
                      <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <span className="capitalize">{label.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-mono text-slate-300">{Math.round(weight * 100)}%</span>
                      </div>
                    ))}
                    <div className="pt-1 text-[10px] italic leading-4 text-slate-600">
                      Prototype weights are transparent and illustrative; they are not a validated emergency-risk model.
                    </div>
                  </div>
                )}
              </div>

              {!bridgeFailed ? (
                <Button variant="danger" onClick={handleSimulateFailure} className="w-full" disabled={top.status !== "confirmed"}>
                  <TriangleAlert size={15} aria-hidden="true" /> Simulate Bridge-3 failure
                </Button>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3 text-xs leading-5 text-emerald-300">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 size={15} aria-hidden="true" /> Replan complete
                  </div>
                  <div className="mt-1 text-emerald-200/65">
                    Route, shelter assignment, citizen alert and department tasks were recalculated.
                  </div>
                </div>
              )}

              <Link
                href="/intelligence"
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-cyan-400 transition-colors hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Open Decision Intelligence <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
