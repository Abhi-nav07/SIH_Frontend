const fs = require('fs');
const file = 'lib/scenario/store.ts';
let code = fs.readFileSync(file, 'utf8');

// Fix the corrupted part:
const badPart = `  const nextShelters: Shelter[] = shelters.map((s) => ({
    ...s,
    occupied: 0,
    status: s.status === "full" ? "ready" : s.status,
  }), {
  name: 'sankat-setu-session',
  storage: createJSONStorage(() => sessionStorage),
  version: 1,
}));`;

const goodPart = `  const nextShelters: Shelter[] = shelters.map((s) => ({
    ...s,
    occupied: 0,
    status: s.status === "full" ? "ready" : s.status,
  }));`;

code = code.replace(badPart, goodPart);

// Now apply the persist correctly to the ACTUAL end of the file.
// The file should end with something like:
//   resetScenario: () => set({ ... }),
// }));

// Find the last `}));`
const lastIndex = code.lastIndexOf("}));");
if (lastIndex !== -1) {
    code = code.substring(0, lastIndex) + "}), {\n  name: 'sankat-setu-session',\n  storage: createJSONStorage(() => sessionStorage),\n  version: 1,\n}));\n" + code.substring(lastIndex + 4);
}

fs.writeFileSync(file, code);
