// Shown instantly while a screen loads, so tapping a tab always responds right away.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-40 rounded-lg bg-surface" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-surface" />
        <div className="h-28 rounded-2xl bg-surface" />
      </div>
      <div className="h-16 rounded-2xl bg-surface" />
      <div className="h-40 rounded-2xl bg-surface" />
    </div>
  );
}
