import { Skeleton } from "@/components/ui/Skeleton";
import { MatchRowSkeleton } from "@/components/app/MatchRowSkeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-56" />

      <div className="mt-6">
        <Skeleton className="mb-2 h-4 w-28" />
        <div className="flex flex-col gap-2">
          <MatchRowSkeleton />
          <MatchRowSkeleton />
        </div>
      </div>

      <div className="mt-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
