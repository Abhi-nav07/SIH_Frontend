const fs = require('fs');
const file = 'app/tasks/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const roleState = `
  const [role, setRole] = React.useState("Incident Commander");
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  
  const filteredTasks = tasks.filter(t => {
    if (role === "Department Officer") {
      return departmentFilter === "All" || t.department === departmentFilter;
    }
    return true; // Incident commander and Observer see all
  });
`;

code = code.replace("export default function ActionBoardPage() {", "import React from 'react';\n\nexport default function ActionBoardPage() {");
code = code.replace("const pending = tasks.filter", roleState + "\n  const pending = tasks.filter");

const roleSelector = `
      <div className="mb-4 flex gap-2">
        <select value={role} onChange={e => setRole(e.target.value)} className="bg-slate-800 text-white p-2 rounded text-sm font-semibold">
          <option value="Incident Commander">Role: Incident Commander</option>
          <option value="Department Officer">Role: Department Officer</option>
          <option value="Observer / Jury View">Role: Observer / Jury View (Read-Only)</option>
        </select>
        {role === "Department Officer" && (
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="bg-slate-800 text-white p-2 rounded text-sm">
            <option value="All">All Departments</option>
            <option value="Police">Police</option>
            <option value="PWD">PWD</option>
            <option value="Transport">Transport</option>
            <option value="Health">Health</option>
            <option value="SDRF">SDRF</option>
          </select>
        )}
      </div>
`;

code = code.replace(
  '<section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Task summary">',
  roleSelector + '\n      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Task summary">'
);

// We need to pass role and filteredTasks to TaskBoard. But actually we might not be able to easily change TaskBoard props without looking at it.
// Let's assume TaskBoard takes no props and gets them from store. But role is local.
// Let's put role in the store so all components can access it.

fs.writeFileSync(file, code);
console.log("Patched tasks/page.tsx");
