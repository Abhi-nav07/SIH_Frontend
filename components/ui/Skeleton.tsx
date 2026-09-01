import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  /** Number of skeleton lines to render */
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={cn("space-y-2.5", className)} aria-busy="true" aria-label="Loading">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-3.5 rounded-md bg-white/[0.08]",
              i === lines - 1 ? "w-2/3" : "w-full",
            )}
            style={{ animation: `skeleton-pulse 1.5s ease-in-out ${i * 0.1}s infinite` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("h-4 w-full rounded-md bg-white/[0.08]", className)}
      style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.075] bg-[#0a1422]/88 p-5", className)} aria-busy="true" aria-label="Loading content">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-1/2" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}
