import { Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface PublishToggleProps {
  isPublished: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: number;
  label?: string;
  className?: string;
}

export function PublishToggle({
  isPublished,
  isLoading = false,
  onToggle,
  disabled = false,
  size = 12,
  label,
  className = "inline-flex items-center gap-1 text-xs text-slate-500",
}: PublishToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || isLoading}
      aria-label={isPublished ? "비공개로 전환" : "공개로 전환"}
      className={className}
    >
      {isLoading ? (
        <Spinner size={size} />
      ) : isPublished ? (
        <Eye size={size} />
      ) : (
        <EyeOff size={size} />
      )}
      {label ? <span>{label}</span> : null}
    </button>
  );
}
