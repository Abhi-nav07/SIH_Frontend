const fs = require('fs');
const file = 'lib/scenario/store.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("export const useScenarioStore = create<ScenarioStore>((set, get) => ({", "export const useScenarioStore = create<ScenarioStore>()(persist((set, get) => ({");

fs.writeFileSync(file, code);
