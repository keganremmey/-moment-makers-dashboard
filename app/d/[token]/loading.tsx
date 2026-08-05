export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-8">
        <div className="motion-safe:animate-pulse h-14 w-48 rounded-md bg-ink-line" />
        <div className="card p-5">
          <div className="motion-safe:animate-pulse h-4 w-24 rounded bg-ink-line" />
          <div className="motion-safe:animate-pulse mt-3 h-5 w-full rounded bg-ink-line" />
        </div>
        <div className="card p-5">
          <div className="motion-safe:animate-pulse h-4 w-24 rounded bg-ink-line" />
          <div className="motion-safe:animate-pulse mt-3 h-5 w-3/4 rounded bg-ink-line" />
        </div>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="motion-safe:animate-pulse h-4 w-24 rounded bg-ink-line" />
          <div className="motion-safe:animate-pulse mt-3 h-5 w-full rounded bg-ink-line" />
        </div>
      </aside>
    </div>
  );
}
