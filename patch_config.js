const fs = require('fs');
const file = 'lib/intelligence/config.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '{ id: "resource", label: "Rescue Team R1 unavailable", description: "Test response resource resilience", change: { type: "RESOURCE_UNAVAILABLE", target_id: "r1" } },',
  `{ id: "resource", label: "Rescue Team R1 unavailable", description: "Test response resource resilience", change: { type: "RESOURCE_UNAVAILABLE", target_id: "r1" } },
  { id: "road_blockage", label: "Road blockage", description: "District Hospital Road becomes impassable", change: { type: "ROAD_BLOCKAGE", target_id: "dh-road" } },
  { id: "hospital_access", label: "Hospital access degradation", description: "District hospital beds reduced by 50%", change: { type: "HOSPITAL_DEGRADATION", target_id: "hospital-1" } },
  { id: "population_exposure", label: "Population exposure increase", description: "Refugees increase local risk by 1000", change: { type: "POP_INCREASE", target_id: "village-alpha" } },`
);

// Add answers for QUICK_QUESTIONS
code = code.replace(
  '"Which village should evacuate first?",\n  "Which routes are unsafe?",\n  "Will any shelter overflow?",\n  "Give me a 30-second situation brief.",',
  `"Which settlement should evacuate first?",
  "Why is this settlement prioritised?",
  "Which routes are blocked?",
  "Which shelter may exceed capacity?",
  "Which rescue team should move next?",
  "Which tasks are overdue?",
  "What changed after Bridge-3 failed?",
  "Which data is stale or low-confidence?",
  "Give a 30-second command brief.",`
);

fs.writeFileSync(file, code);
console.log("Patched config.ts");
