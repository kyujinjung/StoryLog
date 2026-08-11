export default function ReviewLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-28 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-56 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
