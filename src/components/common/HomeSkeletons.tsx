export function ServicesSkeleton(): React.ReactElement {
  return (
    <div className="py-16 md:py-32">
      <div className="mx-auto max-w-7xl animate-pulse px-6">
        <div className="mx-auto mb-8 h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-64 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function ReviewsSkeleton(): React.ReactElement {
  return (
    <div className="py-16 md:py-32">
      <div className="mx-auto max-w-7xl animate-pulse px-6">
        <div className="mx-auto mb-8 h-8 w-48 rounded bg-slate-200" />
        <div className="h-64 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function CustomerReviewsSkeleton(): React.ReactElement {
  return (
    <div className="py-16 md:py-32">
      <div className="mx-auto max-w-2xl animate-pulse px-6">
        <div className="mb-8 h-8 w-32 rounded bg-slate-200" />
        <div className="space-y-4">
          <div className="h-24 rounded bg-slate-200" />
          <div className="h-24 rounded bg-slate-200" />
          <div className="h-24 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
