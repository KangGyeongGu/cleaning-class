interface ReviewCardProps {
  className?: string;
  children: React.ReactNode;
}

export function ReviewCard({
  className,
  children,
}: ReviewCardProps): React.ReactElement {
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white${className ? `${className}` : ""}`}
    >
      {children}
    </article>
  );
}
