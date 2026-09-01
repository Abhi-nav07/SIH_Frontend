const fs = require('fs');

// Fix components/tasks/TaskCard.tsx
let code = fs.readFileSync('components/tasks/TaskCard.tsx', 'utf8');
code = code.replace(
  'const STATUS_TONE: Record<TaskStatus, Tone> = {',
  `const STATUS_TONE: Record<TaskStatus, Tone> = {
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
// just in case it's named something else
code = code.replace(
  'const counts = {',
  `const counts: Record<TaskStatus, number> = {
    draft: 0, dispatched: 0, in_progress: 0, blocked: 0, cancelled: 0, superseded: 0, pending: 0, acknowledged: 0, escalated: 0, completed: 0,`
);

fs.writeFileSync('components/tasks/TaskBoard.tsx', code);

console.log("Fixed typings");
