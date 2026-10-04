// The loading state of Results (stories/E8-1, acceptance 5): the strip of tiles, the tab row
// and the panel as placeholder blocks while the first numbers load (loading.tsx) and while a
// tab loads its own (page.tsx, Suspense).
import { Skeleton } from "@/components/ui/skeleton";

export function PanelSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3" data-testid="panel-skeleton">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5" data-testid="results-skeleton">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="flex gap-3.5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[92px] flex-1 rounded-2xl" />)}</div>
      <Skeleton className="h-10 w-full" />
      <PanelSkeleton />
    </div>
  );
}
