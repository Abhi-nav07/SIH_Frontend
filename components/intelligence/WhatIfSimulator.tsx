import { useState } from "react";
import { ArrowRight, FlaskConical, GitCompareArrows, TriangleAlert } from "lucide-react";
import { CompareResponse } from "@/lib/intelligence/types";
import { WHAT_IF_OPTIONS, SUMMARY_FIELDS } from "@/lib/intelligence/config";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useScenarioStore } from "@/lib/scenario/store";

interface WhatIfSimulatorProps {
  comparison: CompareResponse | null;
  simulating: boolean;
  onRunComparison: (changeId: string) => void;
  onClearComparison: () => void;
}

export function WhatIfSimulator({ comparison, simulating, onRunComparison, onClearComparison }: WhatIfSimulatorProps) {
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);
  const failBridge = useScenarioStore((state) => state.failBridge);
  const [selectedWhatIf, setSelectedWhatIf] = useState("bridge");

  const selectedOption = WHAT_IF_OPTIONS.find((option) => option.id === selectedWhatIf) ?? WHAT_IF_OPTIONS[0];

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWhatIf(event.target.value);
    onClearComparison();
  };

  return (
    <Card>
      <CardHeader className="items-center border-b border-white/7 pb-4">
        <div className="flex items-center gap-3">
          <span className="icon-container bg-violet-400/10 text-violet-300">
            <FlaskConical size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white">What-if simulator</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Preview impact before changing the live operational plan</p>
          </div>
        </div>
        <Badge tone="warning">Simulation only</Badge>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <label className="text-overline" htmlFor="what-if">Scenario change</label>
            <select
              id="what-if"
              value={selectedWhatIf}
              onChange={handleSelect}
              className="mt-2 min-h-11 w-full rounded-xl border border-white/8 bg-[#0d1928] px-3 text-xs font-semibold text-slate-200 outline-none focus:border-violet-400/40"
            >
              {WHAT_IF_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">{selectedOption.description}</p>
            <Button
              onClick={() => onRunComparison(selectedWhatIf)}
              disabled={simulating}
              loading={simulating}
              className="mt-4 w-full"
            >
              <GitCompareArrows size={14} aria-hidden="true" />
              {simulating ? "Computing…" : "Compare before / after"}
            </Button>
            {selectedWhatIf === "bridge" && comparison && !bridgeFailed && (
              <Button variant="danger" onClick={failBridge} className="mt-2 w-full">
                <TriangleAlert size={14} aria-hidden="true" /> Apply after officer confirmation
              </Button>
            )}
          </div>

          {comparison ? (
            <div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <div className="surface-inset">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Before</div>
                  {SUMMARY_FIELDS.map((field) => (
                    <div key={field.key} className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span>{field.label}</span>
                      <b className="font-mono text-slate-300">{comparison.before[field.key].toLocaleString("en-IN")}</b>
                    </div>
                  ))}
                </div>
                <div className="grid place-items-center text-slate-700 py-2 sm:py-0">
                  <ArrowRight size={18} className="rotate-90 sm:rotate-0" aria-hidden="true" />
                </div>
                <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.045] p-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-violet-300">After</div>
                  {SUMMARY_FIELDS.map((field) => (
                    <div key={field.key} className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span>{field.label}</span>
                      <b className="font-mono text-white">{comparison.after[field.key].toLocaleString("en-IN")}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="list">
                {comparison.narrative.map((line) => (
                  <span key={line} role="listitem" className="rounded-lg bg-orange-400/[0.08] px-2.5 py-2 text-[10px] font-semibold text-orange-200">
                    {line}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                Computed by {comparison.source === "service" ? "V0.4 intelligence service" : "frontend deterministic fallback"}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[14rem] place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-5 text-center">
              <div>
                <GitCompareArrows size={23} className="mx-auto text-slate-700" aria-hidden="true" />
                <div className="mt-3 text-xs font-bold text-slate-400">No comparison computed</div>
                <div className="mt-1 text-[11px] text-slate-600">Choose a change and run the impact comparison.</div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
