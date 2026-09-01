const fs = require('fs');
const file = 'app/citizen/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const langState = `
  const [lang, setLang] = React.useState("en");
  const [channel, setChannel] = React.useState("mobile");
`;

code = code.replace("export default function CitizenPage() {", "import React from 'react';\n\nexport default function CitizenPage() {");
code = code.replace("const assistanceTask =", langState + "\n  const assistanceTask =");

const controls = `
      <div className="flex gap-2">
        <select value={lang} onChange={e => setLang(e.target.value)} className="bg-slate-800 text-white p-2 rounded">
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
        <select value={channel} onChange={e => setChannel(e.target.value)} className="bg-slate-800 text-white p-2 rounded">
          <option value="mobile">Mobile App</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="ivrs">IVRS Script</option>
        </select>
        <select className="bg-slate-800 text-white p-2 rounded" title="Demo location selector">
          <option>Demo Location: Current Village</option>
          <option>Demo Location: Village Alpha</option>
        </select>
      </div>
`;

code = code.replace(
  '<PageHeader',
  controls + '\n      <PageHeader'
);

code = code.replace(
  '<CitizenPhone />',
  `{channel === "mobile" && <CitizenPhone />}
   {channel !== "mobile" && (
     <div className="text-white p-4 border border-white/20 rounded">
       Previewing {channel} in {lang === "en" ? "English" : "Hindi"}
       <br/><br/>
       {lang === "en" ? "Evacuate immediately." : "कृपया तुरंत सुरक्षित स्थान पर जाएँ।"}
     </div>
   )}`
);

fs.writeFileSync(file, code);
console.log("Patched app/citizen/page.tsx");
