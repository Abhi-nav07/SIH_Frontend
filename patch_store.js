const fs = require('fs');
const file = 'lib/scenario/store.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace standard create with persist wrapper
if (!code.includes('persist')) {
    code = code.replace("import { create } from \"zustand\";", "import { create } from \"zustand\";\nimport { persist, createJSONStorage } from \"zustand/middleware\";");
    code = code.replace("export const useScenarioStore = create<ScenarioState>()((set, get) => ({", "export const useScenarioStore = create<ScenarioState>()(persist((set, get) => ({");
    code = code.replace("}));", "}), {\n  name: 'sankat-setu-session',\n  storage: createJSONStorage(() => sessionStorage),\n  version: 1,\n}));");
    fs.writeFileSync(file, code);
    console.log("Patched store.ts for sessionStorage");
}
