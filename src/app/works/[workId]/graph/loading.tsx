export default function GraphLoading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10">
      <div className="h-10 w-52 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-[70vh] min-h-[520px] animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
