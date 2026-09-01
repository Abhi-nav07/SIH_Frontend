import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-slate-400">
      <Loader2 size={32} className="animate-spin text-cyan-500" />
      <p className="text-sm font-medium tracking-wide">Loading module...</p>
    </div>
  );
}
