import { Skeleton } from "@/components/ui/Skeleton";

/** Mirrors MatchRow's shape so the loading state doesn't jump when data arrives. */
export function MatchRowSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-surface/60 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 pl-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 pl-1">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-[26px] w-[26px] shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-[26px] w-[26px] shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
    </div>
  );
}
