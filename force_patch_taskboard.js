const fs = require('fs');
let code = fs.readFileSync('components/tasks/TaskBoard.tsx', 'utf8');

const newFilters = `  const [deptFilter, setDeptFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => filter === "all" || task.status === filter)
      .filter((task) => deptFilter === "all" || task.department === deptFilter)
      .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
      .filter(
        (task) =>
          !normalized ||
          \`\${task.title} \${task.department} \${task.reasonCode}\`.toLowerCase().includes(normalized),
      )
      .sort((a, b) => {
        const statusWeight: Record<TaskStatus, number> = { 
          escalated: 0, pending: 1, acknowledged: 2, in_progress: 3, 
          blocked: 4, dispatched: 5, draft: 6, completed: 7, cancelled: 8, superseded: 9 
        };
        return (
          statusWeight[a.status] - statusWeight[b.status] ||
          a.priority.localeCompare(b.priority) ||
          a.createdAtSec - b.createdAtSec
        );
      });
  }, [filter, query, tasks, deptFilter, priorityFilter]);`;

// Just regex replace the entire useMemo block.
code = code.replace(/const visibleTasks = useMemo\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/, newFilters);

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

fs.writeFileSync('components/tasks/TaskBoard.tsx', code);
