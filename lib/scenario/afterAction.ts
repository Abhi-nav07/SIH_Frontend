import { AfterActionMetrics, RecommendedAction, Task } from "./types";

export function computeAfterActionMetrics(
  actions: RecommendedAction[],
  tasks: Task[],
  replans: number
): AfterActionMetrics {
  const actionsGenerated = actions.length;
  const actionsCompleted = tasks.filter((t) => t.status === "completed").length;

  const ackDurations = tasks.filter((t) => t.ackAtSec !== null).map((t) => t.ackAtSec! - t.createdAtSec);
  const completeDurations = tasks
    .filter((t) => t.completedAtSec !== null)
    .map((t) => t.completedAtSec! - t.createdAtSec);

  const avgAckSeconds = ackDurations.length
    ? Math.round(ackDurations.reduce((a, b) => a + b, 0) / ackDurations.length)
    : null;
  const avgCompleteSeconds = completeDurations.length
    ? Math.round(completeDurations.reduce((a, b) => a + b, 0) / completeDurations.length)
    : null;

  let coordinationScore: number | null = null;
  if (tasks.length > 0) {
    const completionRatio = actionsCompleted / tasks.length;
    const escalated = tasks.filter((t) => t.status === "escalated").length;
    const escalationPenalty = tasks.length ? escalated / tasks.length : 0;
    const replanPenalty = Math.min(replans * 0.05, 0.2);
    coordinationScore = Math.round(
      Math.max(0, completionRatio * 100 - escalationPenalty * 30 - replanPenalty * 100)
    );
  }

  return {
    actionsGenerated,
    actionsCompleted,
    criticalReplans: replans,
    avgAckSeconds,
    avgCompleteSeconds,
    coordinationScore,
  };
}
