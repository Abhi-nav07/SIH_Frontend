const fs = require('fs');
const file = 'components/layout/AppShell.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('ServiceIndicator')) {
  code = code.replace(
    'import { Navigation } from "./Navigation";',
    'import { Navigation } from "./Navigation";\nimport { ServiceIndicator } from "./ServiceIndicator";'
  );
  code = code.replace(
    '<main className="flex-1 lg:pl-64">',
    '<ServiceIndicator />\n        <main className="flex-1 lg:pl-64">'
  );
  fs.writeFileSync(file, code);
}
