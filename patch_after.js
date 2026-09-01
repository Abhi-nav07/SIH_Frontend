const fs = require('fs');
const file = 'app/after/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const csvLogic = `
  const sanitizeCSV = (val: any) => {
    const str = String(val);
    if (/^[=+\-@]/.test(str)) return "'" + str;
    return str;
  };
  
  const handleCSVDownload = () => {
    try {
      const headers = "ID,Title,Department,Status,Priority,CreatedAt,SLA\\n";
      const rows = tasks.map(t => 
        [t.id, t.title, t.department, t.status, t.priority, t.createdAtSec, t.slaSeconds]
        .map(sanitizeCSV)
        .join(",")
      ).join("\\n");
      
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "sankat-setu-tasks.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      toast("CSV report downloaded", "success");
    } catch {
      toast("Failed to generate CSV", "critical");
    }
  };

  const handlePrint = () => {
    window.print();
  };
`;

code = code.replace("const handleDownload = () => {", csvLogic + "\n  const handleDownload = () => {");
code = code.replace(
  '<Download size={14} aria-hidden="true" /> Export report',
  'JSON'
);
code = code.replace(
  '<Button variant="secondary" onClick={handleDownload} disabled={tasks.length === 0}>',
  `<div className="flex gap-2">
    <Button variant="secondary" onClick={handlePrint} disabled={tasks.length === 0}>Print</Button>
    <Button variant="secondary" onClick={handleCSVDownload} disabled={tasks.length === 0}>CSV</Button>
    <Button variant="secondary" onClick={handleDownload} disabled={tasks.length === 0}>`
);
code = code.replace(
  '</Button>\n        }',
  '</Button>\n    </div>\n        }'
);

// add print styles to hide navigation
code = code.replace(
  'export default function AfterActionPage() {',
  `export default function AfterActionPage() {
    if (typeof window !== "undefined") {
      const style = document.createElement("style");
      style.innerHTML = \`@media print { nav, button { display: none !important; } body { background: white; color: black; } }\`;
      document.head.appendChild(style);
    }
  `
);

fs.writeFileSync(file, code);
console.log("Patched app/after/page.tsx");
