const fs = require('fs');
const file = 'lib/scenario/types.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'export type TaskStatus = "pending" | "acknowledged" | "completed" | "escalated";',
  'export type TaskStatus = "draft" | "dispatched" | "pending" | "acknowledged" | "in_progress" | "blocked" | "escalated" | "completed" | "cancelled" | "superseded";'
);

// We also need to add related entity IDs, Actor role, Simulated status to TimelineEvent.
// Since it asks for a unified event model.
code = code.replace(
  'export interface TimelineEvent {\n  id: string;\n  atSec: number;\n  label: string;\n  detail: string;\n  kind: "info" | "warning" | "critical" | "success";\n}',
  `export interface TimelineEvent {
  id: string;
  atSec: number;
  label: string;
  detail: string;
  kind: "info" | "warning" | "critical" | "success";
  eventType?: "scenario" | "alert" | "analysis" | "recommendation" | "confirmation" | "task" | "citizen" | "infrastructure" | "replan" | "escalation" | "verification" | "report";
  relatedEntityIds?: string[];
  source?: string;
  actorRole?: string;
  simulatedStatus?: string;
}`
);

fs.writeFileSync(file, code);
console.log("Patched types.ts");
