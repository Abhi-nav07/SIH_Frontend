"use client";

import { X } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { BRIDGE, HOSPITAL, RESCUE_TEAMS } from "@/lib/scenario/data";
import { Button } from "@/components/ui/Button";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";

interface AssetInspectorProps {
  selectedAsset: string | null;
  onClose: () => void;
}

export function AssetInspector({ selectedAsset, onClose }: AssetInspectorProps) {
  const villages = useScenarioStore((state) => state.villages);
  const shelters = useScenarioStore((state) => state.shelters);
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);

  if (!selectedAsset) return null;

  let title = "";
  let content = null;

  if (selectedAsset === "bridge-3") {
    title = "Infrastructure: Bridge-3";
    content = (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-slate-500">Status</div>
          <div className={`font-bold ${bridgeFailed ? "text-red-400" : "text-emerald-400"}`}>
            {bridgeFailed ? "FAILED" : "OPERATIONAL"}
          </div>
          <div className="text-slate-500">Dependency</div>
          <div className="text-slate-300">Primary Evacuation Route</div>
          <div className="text-slate-500">Provenance</div>
          <div>
            <ProvenanceTag 
              source="Structural Sensor + Field Report" 
              sourceType="sensor"
              observedAt={`T-${Math.floor(Math.random() * 10) + 2}m`} 
              confidence={85} 
              freshness="current" 
              isSimulated={true} 
            />
          </div>
        </div>
      </div>
    );
  } else if (selectedAsset === "hospital") {
    title = "District Hospital";
    content = (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-slate-500">Status</div>
          <div className="font-bold text-emerald-400">OPERATIONAL</div>
          <div className="text-slate-500">Capacity</div>
          <div className="text-slate-300">85% utilized</div>
        </div>
      </div>
    );
  } else if (selectedAsset.startsWith("team-")) {
    title = `Rescue Team: ${selectedAsset.toUpperCase()}`;
    content = (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-slate-500">Resource Type</div>
          <div className="text-slate-300">SDRF Swift Water</div>
          <div className="text-slate-500">Availability</div>
          <div className="font-bold text-emerald-400">STANDBY</div>
        </div>
      </div>
    );
  } else if (selectedAsset.startsWith("shelter-")) {
    const shelter = shelters.find(s => s.id === selectedAsset);
    title = `Shelter: ${shelter?.name || "Unknown"}`;
    if (shelter) {
      content = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-500">Capacity</div>
            <div className="text-slate-300">{shelter.capacity}</div>
            <div className="text-slate-500">Assigned</div>
            <div className="text-slate-300">{shelter.occupied}</div>
            <div className="text-slate-500">Remaining</div>
            <div className="text-slate-300">{Math.max(0, shelter.capacity - shelter.occupied)}</div>
            <div className="text-slate-500">Status</div>
            <div className={`font-bold ${shelter.status === "full" ? "text-orange-400" : "text-emerald-400"}`}>
              {shelter.status.toUpperCase()}
            </div>
          </div>
        </div>
      );
    }
  } else {
    // Village
    const village = villages.find(v => v.id === selectedAsset);
    if (village) {
      title = `Settlement: ${village.name}`;
      content = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-500">Population</div>
            <div className="text-slate-300">{village.population}</div>
            <div className="text-slate-500">Vulnerable</div>
            <div className="text-slate-300">{village.vulnerablePopulation}</div>
            <div className="text-slate-500">Risk Score</div>
            <div className="font-mono text-slate-300">{Math.round(village.riskScore * 100)} / 100</div>
            <div className="text-slate-500">Hazard Severity</div>
            <div className="font-mono text-slate-300">{Math.round(village.hazardSeverity * 100)}%</div>
            <div className="text-slate-500">Status</div>
            <div className="font-bold text-orange-400">{village.status.toUpperCase()}</div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 m-4 rounded-xl border border-white/10 bg-[#0d1725]/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-auto sm:left-4 sm:right-auto sm:top-14 sm:w-80">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
      <div className="mt-4">
        {content}
      </div>
    </div>
  );
}
