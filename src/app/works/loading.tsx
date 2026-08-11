export default function WorksLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
