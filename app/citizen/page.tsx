"use client";

import { Accessibility, CheckCircle2, MapPinned, Route, Send, Smartphone, Users } from "lucide-react";
import { CitizenPhone } from "@/components/citizen/CitizenPhone";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useScenarioStore } from "@/lib/scenario/store";

const FEATURES = [
  { icon: MapPinned, title: "Location-aware", description: "Content is scoped to the citizen’s settlement risk." },
  { icon: Route, title: "Route-aware", description: "Instructions change when a road or bridge becomes unsafe." },
  { icon: Users, title: "Capacity-aware", description: "The assigned shelter reflects the current evacuation plan." },
  { icon: Accessibility, title: "Assistance loop", description: "A support request creates a P1 task for the command team." },
];

export default function CitizenPage() {
  const instruction = useScenarioStore((state) => state.citizenInstruction);
  const responses = useScenarioStore((state) => state.citizenResponses);
  const tasks = useScenarioStore((state) => state.tasks);
  const assistanceTask = tasks.find((task) => task.reasonCode === "CITIZEN_ASSISTANCE_REQUEST");

  return (
    <div>
      <PageHeader
        eyebrow="Last-mile safety"
        title="Personalized Citizen Alert"
        description="Turn a broad warning into one clear instruction: where to go, which route to use, when to leave and how to request help."
        actions={<Badge tone="critical">Actionable warning</Badge>}
      />

      <section className="mt-6 grid items-start gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="overflow-hidden bg-gradient-to-b from-cyan-500/[0.055] to-[#0a1422] p-4 sm:p-6">
          <CitizenPhone />
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-600"><Smartphone size={12} /> Citizen mobile preview · multilingual channel-ready</div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-white/7 pb-4"><div><h2 className="text-sm font-bold text-white">Alert composition</h2><p className="mt-1 text-xs text-slate-500">Why this message is operational—not generic</p></div><Send size={16} className="text-cyan-400" /></CardHeader>
            <CardBody className="grid gap-3 pt-4 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-xl border border-white/7 bg-white/[0.025] p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon size={17} /></span>
                  <h3 className="mt-3 text-xs font-bold text-slate-200">{title}</h3>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/7 pb-4"><div><h2 className="text-sm font-bold text-white">Citizen-to-command feedback</h2><p className="mt-1 text-xs text-slate-500">Responses become visible operational signals</p></div><Badge tone={responses.length ? "success" : "neutral"}>{responses.length} received</Badge></CardHeader>
            <CardBody className="pt-4">
              {responses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-slate-500">Use the phone preview to submit an evacuation status or assistance request.</div>
              ) : (
                <div className="space-y-3">
                  {responses.map((response) => (
                    <div key={response.villageId} className="flex flex-col gap-3 rounded-xl border border-white/7 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 size={17} /></span><div><div className="text-xs font-bold text-slate-200">{instruction?.villageName ?? response.villageId}</div><div className="mt-1 text-[11px] text-slate-500">{response.status === "assistance" ? "Mobility / medical assistance requested" : "Evacuation in progress"}</div></div></div>
                      <Badge tone={response.status === "assistance" ? "critical" : "success"}>{response.status}</Badge>
                    </div>
                  ))}
                  {assistanceTask && <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.07] p-3 text-[11px] leading-5 text-orange-200"><b>P1 task created:</b> {assistanceTask.title} · {assistanceTask.department}</div>}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
