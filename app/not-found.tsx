import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <FileQuestion size={40} className="text-slate-500" />
      <div>
        <h2 className="text-lg font-bold text-white">Module Not Found</h2>
        <p className="mt-1 text-sm text-slate-400">The requested operational view does not exist.</p>
      </div>
      <Link href="/">
        <Button variant="secondary">
          <ArrowLeft size={14} className="mr-2" /> Return to Command Center
        </Button>
      </Link>
    </div>
  );
}
