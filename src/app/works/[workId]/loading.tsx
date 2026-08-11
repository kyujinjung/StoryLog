export default function WorkDetailLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="h-44 animate-pulse rounded-lg bg-muted" />
        <div className="h-44 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
