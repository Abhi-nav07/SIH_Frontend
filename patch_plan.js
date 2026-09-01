const fs = require('fs');
const file = 'app/plan/page.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Try to inject verification mock logic if we find the word verified
  code = code.replace(
    'export default function DDMPPage() {',
    `import { useToast } from "@/components/ui/Toast";
    export default function DDMPPage() {
      const { toast } = useToast();
      const handleVerify = () => { toast("Verification simulated. Audit log updated.", "success"); };
    `
  );
  fs.writeFileSync(file, code);
}
