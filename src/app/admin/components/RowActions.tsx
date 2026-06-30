import { Edit, Trash2 } from "lucide-react";
import { IconButton, IconLink } from "@/components/ui/IconButton";
import { Spinner } from "@/components/ui/Spinner";

type RowActionsVariant = "mobile" | "desktop";

const ICON_SIZE: Record<RowActionsVariant, number> = {
  mobile: 12,
  desktop: 14,
};

const EDIT_CLASS: Record<RowActionsVariant, string> = {
  mobile: "rounded border border-slate-200 p-2 text-slate-500",
  desktop:
    "border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900",
};

const DELETE_CLASS: Record<RowActionsVariant, string> = {
  mobile:
    "rounded border border-slate-200 p-2 text-slate-500 disabled:opacity-50",
  desktop:
    "border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50",
};

interface RowActionsProps {
  variant: RowActionsVariant;
  editHref?: string;
  editLabel?: string;
  deleteLabel: string;
  onDelete: () => void;
  isDeleting: boolean;
  deleteDisabled?: boolean;
}

export function RowActions({
  variant,
  editHref,
  editLabel,
  deleteLabel,
  onDelete,
  isDeleting,
  deleteDisabled,
}: RowActionsProps): React.ReactElement {
  const size = ICON_SIZE[variant];
  return (
    <>
      {editHref !== undefined && editLabel !== undefined && (
        <IconLink
          href={editHref}
          label={editLabel}
          icon={<Edit size={size} />}
          className={EDIT_CLASS[variant]}
        />
      )}
      <IconButton
        tone="danger"
        onClick={onDelete}
        disabled={deleteDisabled ?? isDeleting}
        label={deleteLabel}
        icon={isDeleting ? <Spinner size={size} /> : <Trash2 size={size} />}
        className={DELETE_CLASS[variant]}
      />
    </>
  );
}
