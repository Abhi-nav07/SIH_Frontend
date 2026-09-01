const fs = require('fs');

// Fix lib/intelligence/types.ts for WhatIfChange
let code = fs.readFileSync('lib/intelligence/types.ts', 'utf8');
code = code.replace(
  'type: "BRIDGE_FAILURE" | "RAIN_INTENSITY_CHANGE" | "SHELTER_CLOSURE" | "RESOURCE_UNAVAILABLE";',
  'type: "BRIDGE_FAILURE" | "RAIN_INTENSITY_CHANGE" | "SHELTER_CLOSURE" | "RESOURCE_UNAVAILABLE" | "ROAD_BLOCKAGE" | "HOSPITAL_DEGRADATION" | "POP_INCREASE";'
);
fs.writeFileSync('lib/intelligence/types.ts', code);

// Fix components/tasks/TaskCard.tsx
code = fs.readFileSync('components/tasks/TaskCard.tsx', 'utf8');
code = code.replace(
  'const STATUS_TONES: Record<TaskStatus, Tone> = {',
  `const STATUS_TONES: Record<TaskStatus, Tone> = {
    draft: "neutral", dispatched: "neutral", in_progress: "info",
    blocked: "critical", cancelled: "neutral", superseded: "neutral",`
);
fs.writeFileSync('components/tasks/TaskCard.tsx', code);

// Fix components/tasks/TaskBoard.tsx
code = fs.readFileSync('components/tasks/TaskBoard.tsx', 'utf8');
code = code.replace(
  'const counts: Record<TaskStatus, number> = {',
  `const counts: Record<TaskStatus, number> = {
    draft: 0, dispatched: 0, in_progress: 0, blocked: 0, cancelled: 0, superseded: 0,`
);
fs.writeFileSync('components/tasks/TaskBoard.tsx', code);

console.log("Fixed typings");
