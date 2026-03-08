import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx('skeleton rounded', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-[2.5/3.5] w-full" />
      <div className="p-2 space-y-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
