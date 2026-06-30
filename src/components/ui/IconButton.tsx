import Link from "next/link";

type IconTone = "default" | "danger";

const ICON_BASE =
  "inline-flex items-center justify-center rounded border transition-colors";

const toneClass: Record<IconTone, string> = {
  default: "border-slate-200 text-slate-600 hover:bg-slate-50",
  danger:
    "border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600",
};

interface IconButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label"
> {
  icon: React.ReactNode;
  label: string;
  tone?: IconTone;
}

export function IconButton({
  icon,
  label,
  tone = "default",
  className = "p-2",
  type = "button",
  ...props
}: IconButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      aria-label={label}
      className={`${ICON_BASE} ${toneClass[tone]} ${className}`.trim()}
      {...props}
    >
      {icon}
    </button>
  );
}

interface IconLinkProps extends Omit<
  React.ComponentProps<typeof Link>,
  "aria-label"
> {
  icon: React.ReactNode;
  label: string;
  tone?: IconTone;
}

export function IconLink({
  icon,
  label,
  tone = "default",
  className = "p-2",
  ...props
}: IconLinkProps): React.ReactElement {
  return (
    <Link
      aria-label={label}
      className={`${ICON_BASE} ${toneClass[tone]} ${className}`.trim()}
      {...props}
    >
      {icon}
    </Link>
  );
}
