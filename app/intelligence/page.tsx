import { Badge } from "@/components/ui/Badge";
import { IntelligenceWorkbench } from "@/components/intelligence/IntelligenceWorkbench";
import { PageHeader } from "@/components/layout/PageHeader";

export default function IntelligencePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Explainable command intelligence"
        title="Decision Intelligence"
        description="Interrogate the current scenario, compare controlled changes and keep every recommendation evidence-backed and human-confirmed."
        actions={<Badge tone="info">V0.4 capability</Badge>}
      />
      <div className="mt-6"><IntelligenceWorkbench /></div>
    </div>
  );
}
