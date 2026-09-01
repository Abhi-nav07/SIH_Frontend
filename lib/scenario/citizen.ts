import { CitizenInstruction, RouteEdge, Shelter, Village } from "./types";

export function generateCitizenInstruction(
  village: Village,
  edge: RouteEdge | null,
  shelter: Shelter | null,
  leaveBeforeMinutes: number,
  changedByReplan: boolean
): CitizenInstruction {
  return {
    villageId: village.id,
    villageName: village.name,
    riskLevel: village.status,
    shelterName: shelter ? shelter.name : "Awaiting assignment",
    routeDescription: edge ? edge.label : "Recalculating safe route…",
    leaveBeforeMinutes,
    changedByReplan,
  };
}
