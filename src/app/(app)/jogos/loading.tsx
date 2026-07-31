import { Skeleton } from "@/components/ui/Skeleton";
import { MatchRowSkeleton } from "@/components/app/MatchRowSkeleton";

export default function MatchesLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Jogos</h1>

      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>

      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <MatchRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
