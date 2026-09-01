"use client";

import Link from "next/link";
import { ArrowRight, Download, Lightbulb, Play, Route, Timer, TriangleAlert } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { formatClock } from "@/lib/scenario/timeline";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AfterActionCharts } from "@/components/after/AfterActionCharts";
import { useToast } from "@/components/ui/Toast";

export default function AfterActionPage() {
  const afterAction = useScenarioStore((state) => state.afterAction);
  const events = useScenarioStore((state) => state.events);
  const tasks = useScenarioStore((state) => state.tasks);
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);
  const escalated = tasks.filter((t) => t.status === "escalated").length;
  const { toast } = useToast();

  const handleDownload = () => {
    try {
      const report = {
        reportType: "SANKAT_SETU_AFTER_ACTION_EXERCISE",
        generatedAt: new Date().toISOString(),
        disclaimer: "Prototype exercise data; not an official incident record.",
        metrics: afterAction,
        events,
        tasks,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "sankat-setu-after-action-report.json";
      anchor.click();
      URL.revokeObjectURL(url);
      toast("After-action report downloaded", "success");
    } catch {
      toast("Failed to generate report", "critical");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Exercise learning"
        title="After-Action Intelligence"
        description="Compare recommendations with acknowledgement and execution, expose delays, and turn the exercise into plan improvements."
        actions={
          <Button variant="secondary" onClick={handleDownload} disabled={tasks.length === 0}>
            <Download size={14} aria-hidden="true" /> Export report
          </Button>
        }
      />

      {tasks.length === 0 ? (
        <Card className="mt-6 overflow-hidden">
          <CardBody>
            <EmptyState
              icon={<Play size={23} />}
              title="Run the operational exercise first"
              description="The after-action record is built from real interactions: generated tasks, acknowledgements, completions, replans and citizen responses."
              action={
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-orange-400"
                >
                  Open Command Center <ArrowRight size={15} aria-hidden="true" />
                </Link>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="After-action metrics">
            <StatCard label="Actions generated" value={afterAction.actionsGenerated} hint="recommendation set" tone="info" />
            <StatCard label="Tasks completed" value={afterAction.actionsCompleted} hint={`${tasks.length} assigned in total`} tone="success" />
            <StatCard label="Critical replans" value={afterAction.criticalReplans} hint="triggered by field reality" tone={afterAction.criticalReplans ? "warning" : "neutral"} />
            <StatCard label="Coordination score" value={afterAction.coordinationScore === null ? "—" : `${afterAction.coordinationScore}/100`} hint="illustrative exercise metric" tone="success" />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="border-b border-white/7 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Event chronology</h2>
                  <p className="mt-1 text-xs text-slate-500">Warning-to-action audit trail</p>
                </div>
                <Badge tone="info">{events.length} events</Badge>
              </CardHeader>
              <CardBody className="max-h-[430px] space-y-1 overflow-y-auto pt-4">
                <ol className="space-y-1" aria-label="Event timeline">
                  {events.map((event, index) => (
                    <li key={event.id} className="grid grid-cols-[44px_14px_1fr] gap-2.5">
                      <span className="pt-0.5 font-mono text-[10px] text-slate-600">
                        {formatClock(event.atSec)}
                      </span>
                      <div className="relative flex justify-center">
                        <span
                          className={`mt-1.5 h-2 w-2 rounded-full ${
                            event.kind === "critical"
                              ? "bg-red-400"
                              : event.kind === "warning"
                                ? "bg-orange-400"
                                : event.kind === "success"
                                  ? "bg-emerald-400"
                                  : "bg-cyan-400"
                          }`}
                          aria-hidden="true"
                        />
                        {index < events.length - 1 && (
                          <span className="absolute bottom-0 top-3 w-px bg-white/7" aria-hidden="true" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="text-xs font-bold text-slate-300">{event.label}</div>
                        <div className="mt-1 text-[11px] leading-5 text-slate-500">{event.detail}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="border-b border-white/7 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Department execution</h2>
                  <p className="mt-1 text-xs text-slate-500">Generated compared with completed</p>
                </div>
              </CardHeader>
              <CardBody className="pt-5">
                <AfterActionCharts tasks={tasks} />
                {afterAction.avgAckSeconds !== null && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="flex items-center gap-1.5 text-section-label">
                        <Timer size={11} aria-hidden="true" /> Avg acknowledge
                      </div>
                      <div className="mt-1.5 font-mono text-sm font-bold text-white">
                        {formatClock(afterAction.avgAckSeconds)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="flex items-center gap-1.5 text-section-label">
                        <Timer size={11} aria-hidden="true" /> Avg complete
                      </div>
                      <div className="mt-1.5 font-mono text-sm font-bold text-white">
                        {afterAction.avgCompleteSeconds === null ? "—" : formatClock(afterAction.avgCompleteSeconds)}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </section>

          <Card className="mt-4">
            <CardHeader className="border-b border-white/7 pb-4">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-orange-400" aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Learning signals for the next DDMP revision</h2>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3 pt-4 md:grid-cols-3">
              <div className="surface-inset">
                <Route size={17} className="text-cyan-400" aria-hidden="true" />
                <h3 className="mt-3 text-xs font-bold text-slate-200">Route dependency</h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {bridgeFailed
                    ? "Bridge-3 failure forced a live replan. Maintain and verify the alternate hill route."
                    : "Exercise did not yet test the critical Bridge-3 dependency."}
                </p>
              </div>
              <div className="surface-inset">
                <TriangleAlert
                  size={17}
                  className={escalated ? "text-red-400" : "text-emerald-400"}
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-xs font-bold text-slate-200">Acknowledgement discipline</h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {escalated
                    ? `${escalated} task(s) breached their SLA. Review department escalation contacts.`
                    : "No currently open task has breached its acknowledgement SLA."}
                </p>
              </div>
              <div className="surface-inset">
                <Lightbulb size={17} className="text-orange-400" aria-hidden="true" />
                <h3 className="mt-3 text-xs font-bold text-slate-200">Human-in-the-loop</h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Keep recommendations advisory, preserve evidence and record every officer confirmation.
                </p>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
