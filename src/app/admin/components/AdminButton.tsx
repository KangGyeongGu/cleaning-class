import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";

type Props = Omit<ComponentProps<typeof Button>, "size" | "variant"> & {
  size?: "compact" | "field";
  variant?: "primary" | "outline";
};

export function AdminButton({
  size = "compact",
  variant = "outline",
  className = "",
  ...props
}: Props) {
  return (
    <Button
      {...props}
      variant={variant}
      size="none"
      className={`${size === "field" ? "h-11" : "h-8"} shrink-0 rounded-none px-3 text-xs leading-4 font-medium tracking-normal disabled:cursor-not-allowed disabled:opacity-50 ${variant === "primary" ? "border border-slate-900" : ""} ${className}`}
    />
  );
}
