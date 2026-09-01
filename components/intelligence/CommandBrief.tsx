import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Village, RouteEdge } from "@/lib/scenario/types";
import { useScenarioStore } from "@/lib/scenario/store";

interface CommandBriefProps {
  villages: Village[];
  edges: RouteEdge[];
}

export function CommandBrief({ villages, edges }: CommandBriefProps) {
  const atRisk = villages.filter((village) => village.status !== "safe");
  const populationAtRisk = atRisk.reduce((sum, village) => sum + village.population, 0);
  const blockedCount = edges.filter((edge) => edge.status === "blocked").length;

  const topVillage = [...villages].sort((a, b) => b.riskScore - a.riskScore)[0];
  const urgentTasks = useScenarioStore((state) => state.tasks).filter(t => t.priority === "P1" && t.status !== "completed");
  const capacityUsed = useScenarioStore((state) => state.shelters).reduce((sum, s) => sum + s.occupied, 0);
  const capacityTotal = useScenarioStore((state) => state.shelters).reduce((sum, s) => sum + s.capacity, 0);
  const activeAction = useScenarioStore((state) => state.actions).find(a => a.status === "proposed" || a.status === "confirmed");

  return (
    <Card>
      <CardHeader className="border-b border-white/7 pb-4">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-orange-400" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-white">30-second command brief</h2>
            <p className="mt-1 text-xs text-slate-500">Current structured snapshot</p>
          </div>
        </div>
        <Badge tone="critical">Live</Badge>
      </CardHeader>
      <CardBody className="space-y-3 pt-4">
        <div>
          <div className="text-section-label">Situation</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {populationAtRisk.toLocaleString("en-IN")} people at risk across {atRisk.length} settlements.
          </p>
        </div>
        {topVillage && (
          <div>
            <div className="text-section-label">Highest-risk location</div>
            <p className="mt-1 text-xs leading-5 text-red-300 font-medium">
              {topVillage.name} (Risk score: {Math.round(topVillage.riskScore)})
            </p>
          </div>
        )}
        {activeAction && (
          <div>
            <div className="text-section-label">Immediate action</div>
            <p className="mt-1 text-xs font-bold leading-5 text-white">
              {activeAction.title}
            </p>
          </div>
        )}
        <div>
          <div className="text-section-label">Resource concern</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {urgentTasks.length > 0 ? `${urgentTasks.length} uncompleted P1 tasks requiring attention.` : "All critical tasks acknowledged."}
          </p>
        </div>
        <div>
          <div className="text-section-label">Route concern</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {blockedCount > 0 ? `${blockedCount} critical evacuation routes blocked.` : "Primary routes currently passable."}
          </p>
        </div>
        <div>
          <div className="text-section-label">Shelter concern</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            District shelter capacity at {Math.round((capacityUsed / (capacityTotal || 1)) * 100)}%.
          </p>
        </div>
        {activeAction?.status === "proposed" && (
          <div>
            <div className="text-section-label">Next decision deadline</div>
            <p className="mt-1 text-xs font-semibold leading-5 text-orange-400">
              Officer confirmation required within {activeAction.windowMinutes} minutes.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
