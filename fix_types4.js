const fs = require('fs');
let code = fs.readFileSync('components/tasks/TaskBoard.tsx', 'utf8');
code = code.replace(
  'const statusWeight: Record<TaskStatus, number> = { escalated: 0, pending: 1, acknowledged: 2, completed: 3 };',
  `const statusWeight: Record<TaskStatus, number> = { 
    escalated: 0, pending: 1, acknowledged: 2, in_progress: 3, 
    blocked: 4, dispatched: 5, draft: 6, completed: 7, cancelled: 8, superseded: 9 
  };`
);
fs.writeFileSync('components/tasks/TaskBoard.tsx', code);
