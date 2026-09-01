const fs = require('fs');
const file = 'components/tasks/TaskBoard.tsx';
let code = fs.readFileSync(file, 'utf8');

// I will insert extra filters visually and functionally.
const newFilters = `
  const [deptFilter, setDeptFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const role = useScenarioStore((state) => (state as any).role || "Incident Commander");
  const isReadOnly = role === "Observer / Jury View";

  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => filter === "all" || task.status === filter)
      .filter((task) => deptFilter === "all" || task.department === deptFilter)
      .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
      .filter(
        (task) =>
          !normalized ||
          \`\${task.title} \${task.department} \${task.reasonCode}\`.toLowerCase().includes(normalized)
      ).sort((a,b) => {
         // Sort by urgency (SLA, priority)
         if (a.status === 'escalated' && b.status !== 'escalated') return -1;
         if (b.status === 'escalated' && a.status !== 'escalated') return 1;
         if (a.priority === 'P1' && b.priority !== 'P1') return -1;
         if (b.priority === 'P1' && a.priority !== 'P1') return 1;
         return a.slaSeconds - b.slaSeconds;
      });
  }, [tasks, filter, query, deptFilter, priorityFilter]);
`;

code = code.replace(
  'const visibleTasks = useMemo(() => {\n    const normalized = query.trim().toLowerCase();\n    return tasks\n      .filter((task) => filter === "all" || task.status === filter)\n      .filter(\n        (task) =>\n          !normalized ||\n          `${task.title} ${task.department} ${task.reasonCode}`.toLowerCase().includes(normalized),\n      );\n  }, [tasks, filter, query]);',
  newFilters
);

const newSelects = `
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-8 rounded-lg bg-white/5 px-2 text-xs text-white">
          <option value="all">All Depts</option>
          <option value="Police">Police</option>
          <option value="PWD">PWD</option>
          <option value="Health">Health</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-8 rounded-lg bg-white/5 px-2 text-xs text-white">
          <option value="all">All Priorities</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>
`;

code = code.replace(
  '<div className="relative max-w-sm flex-1">',
  newSelects + '\n        <div className="relative max-w-sm flex-1">'
);

fs.writeFileSync(file, code);
console.log("Patched TaskBoard.tsx");
