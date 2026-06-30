interface EmptyStateProps {
  message: string;
  children?: React.ReactNode;
}

export function EmptyState({
  message,
  children,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="border border-slate-200 p-12 text-center">
      <p className="font-light text-slate-500">{message}</p>
      {children}
    </div>
  );
}
