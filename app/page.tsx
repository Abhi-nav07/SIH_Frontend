"use client";

import { useState } from "react";
import { Activity, ArrowRight, Play, RotateCcw } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { 
  selectPopulationRisk, 
  selectCriticalZones, 
  selectRoadsBlocked, 
  selectRoadsOpen, 
  selectRoadsTotal, 
  selectOpenActions, 
  selectAssistRequests 
} from "@/lib/scenario/selectors";
import { StatCard } from "@/components/ui/StatCard";
import { DecisionPanel } from "@/components/command/DecisionPanel";
import { TimelinePanel } from "@/components/command/TimelinePanel";
import { RiskMap } from "@/components/map/RiskMap";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { IncidentHeader } from "@/components/command/IncidentHeader";
import { HumanConfirmation } from "@/components/command/HumanConfirmation";

export default function CommandCenterPage() {
  const phase = useScenarioStore((state) => state.phase);
  const startSimulation = useScenarioStore((state) => state.startSimulation);
  const resetScenario = useScenarioStore((state) => state.resetScenario);
  const { toast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const populationRisk = useScenarioStore(selectPopulationRisk);
  const criticalZones = useScenarioStore(selectCriticalZones);
  const open = useScenarioStore(selectRoadsOpen);
  const total = useScenarioStore(selectRoadsTotal);
  const roadsBlocked = useScenarioStore(selectRoadsBlocked);
  const openActions = useScenarioStore(selectOpenActions);
  const assistRequests = useScenarioStore(selectAssistRequests);

  const handleStart = () => {
    startSimulation();
    toast("Exercise started — risk scored, tasks dispatched", "success");
  };

  const handleReset = () => {
    resetScenario();
    setShowResetDialog(false);
    toast("Exercise reset to standby", "info");
  };

  return (
    <div className="flex flex-col gap-6">
      <IncidentHeader />
      
      {phase === "idle" && (
        <div className="flex items-center justify-between rounded-xl bg-slate-900 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-white">Scenario Ready</h2>
            <p className="text-sm text-slate-400">Initialize the incident timeline to begin the exercise.</p>
          </div>
          <Button onClick={handleStart} variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
            <Play size={16} fill="currentColor" aria-hidden="true" /> Start exercise <ArrowRight size={15} aria-hidden="true" />
          </Button>
        </div>
      )}

      {phase !== "idle" && <HumanConfirmation />}

      {/* Situation summary metrics */}
      <section aria-label="Situation summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Population at risk" value={populationRisk.toLocaleString("en-IN")} hint="current exposure estimate" tone="warning" />
        <StatCard label="Critical zones" value={criticalZones} hint="highest-priority settlements" tone="critical" />
        <StatCard label="Routes blocked" value={roadsBlocked} hint={`${open} of ${total} roads operational`} tone={roadsBlocked ? "critical" : "success"} />
        <StatCard label="Open actions" value={openActions} hint="across seven departments" tone="info" />
        <StatCard label="Assistance requests" value={assistRequests} hint="citizen support queue" tone={assistRequests ? "critical" : "neutral"} className="col-span-2 md:col-span-1" />
      </section>

      {/* Map and decision engine */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(350px,0.85fr)]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="items-center border-b border-white/7 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-cyan-400" aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Operational map</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Routes, shelter loading and response assets update with the scenario.
              </p>
            </div>
            {phase !== "idle" && (
              <Button variant="secondary" size="sm" onClick={() => setShowResetDialog(true)}>
                <RotateCcw size={14} aria-hidden="true" /> Reset exercise
              </Button>
            )}
          </CardHeader>
          <CardBody className="p-0">
            <RiskMap />
          </CardBody>
        </Card>
        
        <div className="flex flex-col gap-4">
          <DecisionPanel />
          <TimelinePanel />
        </div>
      </section>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        open={showResetDialog}
        onConfirm={handleReset}
        onCancel={() => setShowResetDialog(false)}
        title="Reset exercise?"
        description="This will clear all tasks, events, citizen responses and replan data. The scenario returns to standby."
        confirmLabel="Reset exercise"
        cancelLabel="Keep running"
        tone="danger"
        icon={<RotateCcw size={18} />}
      />
    </div>
  );
}
