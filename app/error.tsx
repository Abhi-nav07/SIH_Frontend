"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <AlertCircle size={40} className="text-red-400" />
      <div>
        <h2 className="text-lg font-bold text-white">Application Error</h2>
        <p className="mt-1 text-sm text-slate-400">An unexpected error occurred in this module.</p>
      </div>
      <Button onClick={() => reset()} variant="secondary">
        <RotateCcw size={14} className="mr-2" /> Recover Session
      </Button>
    </div>
  );
}
