"use client";

import { Database, FileCheck2, GitCommitHorizontal, Map, RadioTower, RefreshCw } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { routesValidCount } from "@/lib/scenario/routing";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ReadinessPanel } from "@/components/plan/ReadinessPanel";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const PLAN_LAYERS = [
  { icon: Map, label: "Evacuation routes", source: "District road graph", status: "Live" },
  { icon: RadioTower, label: "Warning dissemination", source: "Channel matrix", status: "Verified" },
  { icon: Database, label: "Resource inventory", source: "Department roster", status: "18 / 22" },
  { icon: FileCheck2, label: "Shelter SOPs", source: "DDMP annexure", status: "Current" },
] as const;

export default function PlanPage() {
  const edges = useScenarioStore((state) => state.edges);
  const shelters = useScenarioStore((state) => state.shelters);
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);
  const { open, total } = routesValidCount(edges);
  const shelterReady = shelters.filter((s) => s.status !== "full").length;

  return (
    <div>
      <PageHeader
        eyebrow="Preparedness as live data"
        title="Living District Disaster Plan"
        description="Replace a static plan document with continuously verifiable routes, facilities, resources and response dependencies."
        actions={<Badge tone="info">Schema v0.4</Badge>}
      />

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Plan readiness metrics">
        <StatCard label="Plan freshness" value="92%" hint="simulated · verified inputs" tone="success" />
        <StatCard label="Resources verified" value="18/22" hint="simulated · within last 30 days" tone="warning" />
        <StatCard label="Routes valid" value={`${open}/${total}`} hint="updates with field state" tone={open === total ? "success" : "critical"} />
        <StatCard label="Shelters usable" value={`${shelterReady}/${shelters.length}`} hint="capacity and access checked" tone="info" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ReadinessPanel
          title="Infrastructure readiness"
          rows={[
            {
              label: "Bridge-3",
              value: bridgeFailed ? "Failed" : "Verified",
              tone: bridgeFailed ? "bad" : "ok",
              meta: bridgeFailed ? "Field failure in current exercise" : "Structural status · 08:42",
            },
            {
              label: "District Hospital Road",
              value: "Open",
              tone: "ok",
              meta: "Police route check · 08:36",
            },
            {
              label: "Shelter A · Govt School",
              value: shelters[0]?.status ?? "Ready",
              tone: shelters[0]?.status === "full" ? "bad" : "ok",
              meta: `${shelters[0]?.occupied.toLocaleString() ?? 0} of ${shelters[0]?.capacity.toLocaleString() ?? 0} assigned`,
            },
            {
              label: "Shelter B · Hill Camp",
              value: shelters[1]?.status ?? "Standby",
              tone: shelters[1]?.status === "full" ? "bad" : bridgeFailed ? "ok" : "warn",
              meta: `${shelters[1]?.occupied.toLocaleString() ?? 0} of ${shelters[1]?.capacity.toLocaleString() ?? 0} assigned`,
            },
          ]}
        />
        <ReadinessPanel
          title="Resource readiness"
          rows={[
            { label: "SDRF rescue teams", value: "2 available", tone: "ok", meta: "R1 west · R2 east" },
            { label: "Ambulances", value: "4 available", tone: "ok", meta: "District hospital roster" },
            { label: "Evacuation buses", value: "2 short", tone: "warn", meta: "Transport gap flagged" },
            { label: "Portable generators", value: "6 available", tone: "ok", meta: "Electricity department" },
          ]}
        />
      </section>

      <Card className="mt-4">
        <CardHeader className="border-b border-white/7 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Machine-readable plan layers</h2>
            <p className="mt-1 text-xs text-slate-500">Operational data behind the district plan</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
            <RefreshCw size={12} aria-hidden="true" /> Simulated sync
          </span>
        </CardHeader>
        <CardBody className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLAN_LAYERS.map(({ icon: Icon, label, source, status }) => (
            <div key={label} className="surface-inset">
              <div className="flex items-start justify-between gap-2">
                <span className="icon-container bg-cyan-400/10 text-cyan-300">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <GitCommitHorizontal size={14} className="text-slate-700" aria-hidden="true" />
              </div>
              <div className="mt-3 text-xs font-bold text-slate-200">{label}</div>
              <div className="mt-1 text-[10px] text-slate-600">{source}</div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400">{status}</div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
