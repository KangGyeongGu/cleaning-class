import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

type ButtonVariant = "primary" | "outline" | "filter";
type ButtonSize = "sm" | "md" | "lg" | "full" | "none";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary inline-flex items-center justify-center gap-2",
  outline: "btn-outline inline-flex items-center justify-center gap-2",
  filter: "btn-filter",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  md: "px-6 py-3",
  lg: "px-8 py-4",
  full: "w-full py-3",
  none: "",
};

function composeClass(
  variant: ButtonVariant,
  size: ButtonSize,
  active: boolean,
  className: string,
): string {
  const filterState =
    variant === "filter"
      ? active
        ? "btn-filter-active"
        : "btn-filter-inactive"
      : "";
  return `${variantClass[variant]} ${sizeClass[size]} ${filterState} ${className}`
    .replace(/\s+/g, " ")
    .trim();
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "lg",
  active = false,
  loading = false,
  className = "",
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      className={composeClass(variant, size, active, className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

export function ButtonLink({
  variant = "primary",
  size = "lg",
  active = false,
  className = "",
  children,
  ...props
}: ButtonLinkProps): React.ReactElement {
  return (
    <Link className={composeClass(variant, size, active, className)} {...props}>
      {children}
    </Link>
  );
}
