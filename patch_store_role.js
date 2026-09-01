const fs = require('fs');
const file = 'lib/scenario/store.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'afterAction: AfterActionMetrics;',
  'afterAction: AfterActionMetrics;\n  role: string;\n  setRole: (role: string) => void;'
);
code = code.replace(
  'afterAction: computeAfterActionMetrics([], [], 0),',
  'afterAction: computeAfterActionMetrics([], [], 0),\n  role: "Incident Commander",\n  setRole: (role: string) => set({ role }),'
);
code = code.replace(
  'resetScenario: () =>',
  'resetScenario: () =>' // just a marker
);

fs.writeFileSync(file, code);
