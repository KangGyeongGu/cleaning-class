interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  className = "",
}: BadgeProps): React.ReactElement {
  return <span className={`tag-pill ${className}`.trim()}>{children}</span>;
}
