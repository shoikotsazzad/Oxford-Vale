export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-sand ${className}`} />;
}

export function ProductGridSkeleton({ count = 10, cols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid gap-4 ${cols}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] rounded-lg" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8" aria-busy="true">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-5 h-10 w-64" />
      <div className="mt-10 lg:ml-[17rem]"><ProductGridSkeleton count={8} cols="grid-cols-2 md:grid-cols-3 xl:grid-cols-4" /></div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:px-8" aria-busy="true">
      <Skeleton className="aspect-[4/5] rounded-lg" />
      <div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-9 w-3/4" />
        <Skeleton className="mt-6 h-6 w-28" />
        <div className="mt-8 flex gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11 w-12" />)}</div>
        <Skeleton className="mt-8 h-12 w-full" />
      </div>
    </div>
  );
}
