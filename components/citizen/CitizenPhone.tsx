"use client";

import { Accessibility, Check, ChevronRight, MapPin, Navigation, RadioTower, Route, Siren, Users } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CitizenPhone() {
  const instruction = useScenarioStore((state) => state.citizenInstruction);
  const responses = useScenarioStore((state) => state.citizenResponses);
  const reportCitizenStatus = useScenarioStore((state) => state.reportCitizenStatus);
  const response = instruction ? responses.find((item) => item.villageId === instruction.villageId) : null;

  return (
    <div
      className="mx-auto w-full max-w-[340px] rounded-[2.5rem] border-[5px] border-slate-800 bg-[#07111f] p-2 shadow-2xl shadow-black/50"
      aria-label="Citizen mobile interface simulation"
    >
      {!instruction ? (
        <div className="flex min-h-[560px] flex-col items-center justify-center rounded-[2rem] bg-[#091321] p-7 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] text-slate-500">
            <RadioTower size={24} aria-hidden="true" />
          </span>
          <div className="mt-5 text-sm font-bold text-slate-300">Waiting for a district alert</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Start the exercise to generate a location, route and shelter-specific citizen instruction.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] bg-[#f4f2eb] text-slate-950">
          <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[9px] font-bold text-slate-600" aria-hidden="true">
            <span>09:42</span>
            <span className="h-4 w-16 rounded-full bg-slate-900" />
            <span>5G · 87%</span>
          </div>
          
          <div className="flex items-center justify-between border-b border-slate-300/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-600 text-white">
                <Siren size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-[10px] font-black tracking-[0.12em]">SANKAT SETU</div>
                <div className="text-[9px] text-slate-500">Verified district alert</div>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          </div>

          <div className="p-4">
            <div
              className={cn(
                "rounded-2xl border p-4",
                instruction.changedByReplan ? "border-orange-300 bg-orange-50" : "border-red-200 bg-red-50"
              )}
              role="alert"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge tone={instruction.riskLevel === "critical" ? "critical" : "warning"}>
                  {instruction.riskLevel} zone
                </Badge>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Now</span>
              </div>
              <h2 className="mt-3 text-xl font-black leading-6">Leave {instruction.villageName} now</h2>
              <p className="mt-2 text-[11px] leading-4 text-slate-600">
                Flash-flood risk is rising. Do not wait near the river corridor.
              </p>
              {instruction.changedByReplan && (
                <div className="mt-3 flex gap-2 rounded-lg bg-orange-100 p-2.5 text-[10px] font-bold leading-4 text-orange-900">
                  <Route size={14} className="shrink-0" aria-hidden="true" /> Route changed because Bridge-3 is closed.
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MapPin size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Your safe point</div>
                  <div className="mt-0.5 text-sm font-black">{instruction.shelterName}</div>
                </div>
              </div>
              <div className="my-3 h-px bg-slate-100" />
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
                  <Navigation size={17} aria-hidden="true" />
                </span>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Safe route</div>
                  <div className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-700">
                    {instruction.routeDescription}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2.5">
                <span className="text-[10px] font-bold text-slate-600">Leave within</span>
                <span className="text-sm font-black text-red-600">{instruction.leaveBeforeMinutes} min</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Response options">
              <Button
                size="sm"
                variant={response?.status === "evacuating" ? "success" : "primary"}
                className="min-h-[44px] px-2 text-[10px]"
                onClick={() => reportCitizenStatus(instruction.villageId, "evacuating")}
              >
                {response?.status === "evacuating" ? <Check size={14} aria-hidden="true" /> : <Users size={14} aria-hidden="true" />} I am evacuating
              </Button>
              <Button
                size="sm"
                variant={response?.status === "assistance" ? "danger" : "secondary"}
                className={cn(
                  "min-h-[44px] px-2 text-[10px]",
                  response?.status !== "assistance" && "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                )}
                onClick={() => reportCitizenStatus(instruction.villageId, "assistance")}
              >
                <Accessibility size={14} aria-hidden="true" /> Need assistance
              </Button>
            </div>

            {response && (
              <div
                className={cn(
                  "mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-bold",
                  response.status === "assistance" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                )}
                role="status"
              >
                <Check size={13} aria-hidden="true" />
                {response.status === "assistance"
                  ? "Rescue request sent to district control."
                  : "Your evacuation status is visible to district control."}
                <ChevronRight size={12} className="ml-auto" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-slate-900" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
