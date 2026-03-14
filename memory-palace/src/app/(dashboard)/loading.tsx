export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-palace-light" />
        <div className="h-4 w-64 rounded bg-palace-light" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-palace-mid/20 bg-palace-light/50"
          />
        ))}
      </div>

      {/* Session card skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-palace-light" />
        <div className="h-40 rounded-2xl border border-palace-mid/20 bg-palace-light/50" />
      </div>

      {/* Button skeleton */}
      <div className="flex justify-center pt-2">
        <div className="h-14 w-52 rounded-xl bg-palace-light" />
      </div>
    </div>
  );
}
