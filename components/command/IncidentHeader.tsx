import { Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useScenarioStore } from "@/lib/scenario/store";
import { selectTopActionConfidence } from "@/lib/scenario/selectors";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function IncidentHeader() {
  const phase = useScenarioStore((state) => state.phase);
  const clockSeconds = useScenarioStore((state) => state.clockSeconds);
  const confidence = useScenarioStore(selectTopActionConfidence);
  
  // Deterministic freshness based on clock
  const freshness = clockSeconds > 300 ? "stale" : clockSeconds > 120 ? "ageing" : "current";
  const getFreshnessColor = (f: string) => {
    if (f === "current") return "text-emerald-500";
    if (f === "ageing") return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Badge tone="critical" className="animate-pulse">SIMULATED EXERCISE</Badge>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Phase: {phase.replace("_", " ")}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Operation Jal Raksha</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-1"><ShieldAlert size={16} /> Flash Flood</span>
          <span>•</span>
          <span>North District</span>
          <span>•</span>
          <span className="font-medium text-slate-800">Severity: Critical</span>
        </div>
      </div>

      <div className="flex flex-row gap-6 sm:flex-col sm:items-end sm:gap-2">
        <div className="flex items-center gap-2 text-right">
          <div className="text-sm font-bold text-slate-500">T+</div>
          <div className="font-mono text-2xl font-black tracking-tight text-slate-900">{formatTime(clockSeconds)}</div>
          <Clock size={20} className="text-slate-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span>Data: <span className={getFreshnessColor(freshness)}>{freshness}</span></span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-500" /> {confidence}% Confidence
          </span>
        </div>
      </div>
    </div>
  );
}
