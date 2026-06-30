interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({
  children,
  className = "",
}: CardProps): React.ReactElement {
  return (
    <div className={`border border-slate-200 bg-white ${className}`.trim()}>
      {children}
    </div>
  );
}
