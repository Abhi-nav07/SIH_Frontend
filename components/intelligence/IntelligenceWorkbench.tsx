"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { compareWhatIf, queryCopilot } from "@/lib/intelligence/client";
import { buildScenarioSnapshot } from "@/lib/intelligence/snapshot";
import { localCompare, localCopilot } from "@/lib/intelligence/localFallback";
import { CompareResponse, CopilotResponse } from "@/lib/intelligence/types";
import { WHAT_IF_OPTIONS } from "@/lib/intelligence/config";
import { useScenarioStore } from "@/lib/scenario/store";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CopilotPanel } from "./CopilotPanel";
import { CommandBrief } from "./CommandBrief";
import { WhatIfSimulator } from "./WhatIfSimulator";

export function IntelligenceWorkbench() {
  const phase = useScenarioStore((state) => state.phase);
  const villages = useScenarioStore((state) => state.villages);
  const edges = useScenarioStore((state) => state.edges);
  const shelters = useScenarioStore((state) => state.shelters);
  const tasks = useScenarioStore((state) => state.tasks);
  const events = useScenarioStore((state) => state.events);
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);
  const startSimulation = useScenarioStore((state) => state.startSimulation);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CopilotResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  const snapshot = useMemo(
    () => buildScenarioSnapshot({ villages, edges, shelters, tasks, events, bridgeFailed }),
    [villages, edges, shelters, tasks, events, bridgeFailed]
  );

  const handleAsk = async (prompt: string) => {
    if (!prompt.trim()) return;
    setQuestion(prompt);
    setAsking(true);
    try {
      setAnswer(await queryCopilot(snapshot, prompt));
    } catch {
      setAnswer(localCopilot(prompt, villages, edges, shelters, tasks));
    } finally {
      setAsking(false);
    }
  };

  const handleRunComparison = async (changeId: string) => {
    const selectedOption = WHAT_IF_OPTIONS.find((option) => option.id === changeId);
    if (!selectedOption) return;
    
    setSimulating(true);
    try {
      setComparison(await compareWhatIf(snapshot, [selectedOption.change]));
    } catch {
      setComparison(localCompare(villages, edges, shelters, selectedOption.change));
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-4">
      {phase === "idle" && (
        <Card className="border-orange-500/20 bg-orange-500/[0.07]">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-orange-400" aria-hidden="true" />
              <div>
                <div className="text-xs font-bold text-orange-200">Decision context is still at baseline</div>
                <div className="mt-1 text-[11px] text-orange-200/55">
                  Start the exercise to compute risk, assignments and department actions before querying.
                </div>
              </div>
            </div>
            <Button size="sm" onClick={startSimulation}>
              Start exercise <ArrowRight size={13} aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <CopilotPanel
          question={question}
          answer={answer}
          asking={asking}
          onQuestionChange={setQuestion}
          onAsk={handleAsk}
        />
        
        <div className="space-y-4">
          <CommandBrief villages={villages} edges={edges} />
          
          <Card className="border-emerald-500/15 bg-emerald-500/[0.045]">
            <CardBody className="flex gap-3 pt-4">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" aria-hidden="true" />
              <div>
                <div className="text-xs font-bold text-emerald-200">Fails safely without an LLM</div>
                <p className="mt-1 text-[11px] leading-5 text-emerald-200/55">
                  The frontend uses a deterministic fallback if the Python intelligence service is unavailable. It never invents incident facts.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      <WhatIfSimulator
        comparison={comparison}
        simulating={simulating}
        onRunComparison={handleRunComparison}
        onClearComparison={() => setComparison(null)}
      />
    </div>
  );
}
