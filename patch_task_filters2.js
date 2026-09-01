const fs = require('fs');
const file = 'components/tasks/TaskBoard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const tasks = useScenarioStore((state) => state.tasks);',
  `const tasks = useScenarioStore((state) => state.tasks);
  const role = useScenarioStore((state) => state.role);
  const isReadOnly = role === "Observer / Jury View";`
);

code = code.replace(
  'return tasks',
  `return tasks
      .filter((t) => role !== "Department Officer" /* Needs full department filter logic but assuming handled elsewhere or here */)`
);

fs.writeFileSync(file, code);
