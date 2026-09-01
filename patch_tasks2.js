const fs = require('fs');
const file = 'app/tasks/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const [role, setRole] = React.useState("Incident Commander");',
  'const role = useScenarioStore((state) => state.role);\n  const setRole = useScenarioStore((state) => state.setRole);'
);

fs.writeFileSync(file, code);
