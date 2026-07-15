// Shown only on a genuinely cold load (no cached data yet) while the first
// fetch for a list is in flight, so a menu click never lands on a blank pane.
export function SkeletonList({ count = 5, itemClassName = "h-11" }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-xl bg-surface-container-highest animate-pulse ${itemClassName}`} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6, itemClassName = "h-40" }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-xl bg-surface-container-highest animate-pulse ${itemClassName}`} />
      ))}
    </div>
  );
}
