"use client";

import Link from "next/link";
import { FastForward, Play, TimerReset } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { completionRate } from "@/lib/scenario/tasks";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { EscalationFeed } from "@/components/tasks/EscalationFeed";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";

import React from 'react';

export default function ActionBoardPage() {
  const phase = useScenarioStore((state) => state.phase);
  const tasks = useScenarioStore((state) => state.tasks);
  const startSimulation = useScenarioStore((state) => state.startSimulation);
  const advanceClock = useScenarioStore((state) => state.advanceClock);
  const { toast } = useToast();

  const rate = completionRate(tasks);
  
  const role = useScenarioStore((state) => state.role);
  const setRole = useScenarioStore((state) => state.setRole);
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  
  const filteredTasks = tasks.filter(t => {
    if (role === "Department Officer") {
      return departmentFilter === "All" || t.department === departmentFilter;
    }
    return true; // Incident commander and Observer see all
  });

  const pending = tasks.filter((t) => t.status === "pending").length;
  const acknowledged = tasks.filter((t) => t.status === "acknowledged").length;
  const escalated = tasks.filter((t) => t.status === "escalated").length;

  const handleStart = () => {
    startSimulation();
    toast("Exercise started", "success");
  };

  const handleAdvance = () => {
    const prevEscalated = tasks.filter((t) => t.status === "escalated").length;
    advanceClock(15);
    // Check for new escalations after advancing (state is already updated synchronously)
    const newState = useScenarioStore.getState();
    const newEscalated = newState.tasks.filter((t) => t.status === "escalated").length;
    if (newEscalated > prevEscalated) {
      toast(`${newEscalated - prevEscalated} task(s) escalated — SLA breached`, "critical");
    } else {
      toast("Exercise time advanced by 15 minutes", "info");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Closed-loop response"
        title="Inter-Agency Action Board"
        description="Track ownership, acknowledgement, execution and escalation across every response department."
        actions={
          phase === "idle" ? (
            <Button onClick={handleStart}>
              <Play size={14} aria-hidden="true" /> Start exercise
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleAdvance}>
              <FastForward size={14} aria-hidden="true" /> Advance 15 min
            </Button>
          )
        }
      />

      
      <div className="mb-4 flex gap-2">
        <select value={role} onChange={e => setRole(e.target.value)} className="bg-slate-800 text-white p-2 rounded text-sm font-semibold">
          <option value="Incident Commander">Role: Incident Commander</option>
          <option value="Department Officer">Role: Department Officer</option>
          <option value="Observer / Jury View">Role: Observer / Jury View (Read-Only)</option>
        </select>
        {role === "Department Officer" && (
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="bg-slate-800 text-white p-2 rounded text-sm">
            <option value="All">All Departments</option>
            <option value="Police">Police</option>
            <option value="PWD">PWD</option>
            <option value="Transport">Transport</option>
            <option value="Health">Health</option>
            <option value="SDRF">SDRF</option>
          </select>
        )}
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Task summary">
        <StatCard label="Pending" value={pending} hint="awaiting acknowledgement" tone="warning" />
        <StatCard label="Acknowledged" value={acknowledged} hint="owned by departments" tone="info" />
        <StatCard
          label="Escalated"
          value={escalated}
          hint="SLA requires attention"
          tone={escalated ? "critical" : "success"}
        />
        <StatCard
          label="Completion"
          value={`${rate}%`}
          hint={`${tasks.filter((t) => t.status === "completed").length} of ${tasks.length} tasks`}
          tone="success"
        />
      </section>

      {tasks.length > 0 && (
        <Card className="mt-4 overflow-hidden">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <span className="icon-container bg-cyan-400/10 text-cyan-300">
                <TimerReset size={17} aria-hidden="true" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-200">Operational completion</div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  Advance exercise time to test SLA escalation.
                </div>
              </div>
            </div>
            <div className="flex min-w-52 items-center gap-3">
              <Progress value={rate} tone="success" />
            </div>
          </div>
        </Card>
      )}

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="border-b border-white/7 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Operational tasks</h2>
              <p className="mt-1 text-xs text-slate-500">Highest urgency and breached SLAs appear first.</p>
            </div>
            <Badge tone="info">{tasks.length} total</Badge>
          </CardHeader>
          <CardBody className="pt-4">
            <TaskBoard />
          </CardBody>
        </Card>
        <Card className="h-fit">
          <CardHeader className="border-b border-white/7 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Escalation monitor</h2>
              <p className="mt-1 text-xs text-slate-500">Next SLA thresholds</p>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <EscalationFeed />
            {phase === "idle" && (
              <Link href="/" className="mt-4 block text-center text-xs font-bold text-orange-400">
                Go to Command Center →
              </Link>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
