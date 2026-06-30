import { useState } from "react";
import { useRouter } from "next/navigation";

export interface RowActionResult {
  success: boolean;
  error?: string;
}

interface RowActionConfig {
  confirmMessage?: string;
  errorMessage: string;
  logLabel: string;
}

interface UseListRowActionsResult {
  deletingId: string | null;
  togglingId: string | null;
  runDelete: (
    id: string,
    action: () => Promise<RowActionResult>,
    config: RowActionConfig,
  ) => Promise<void>;
  runToggle: (
    id: string,
    action: () => Promise<RowActionResult>,
    config: RowActionConfig,
  ) => Promise<void>;
}

export function useListRowActions(): UseListRowActionsResult {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const run = async (
    setBusyId: (id: string | null) => void,
    id: string,
    action: () => Promise<RowActionResult>,
    { confirmMessage, errorMessage, logLabel }: RowActionConfig,
  ): Promise<void> => {
    if (confirmMessage !== undefined && !confirm(confirmMessage)) return;
    setBusyId(id);
    try {
      const result = await action();
      if (!result.success) {
        alert(result.error ?? errorMessage);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(logLabel, err);
      alert(errorMessage);
    } finally {
      setBusyId(null);
    }
  };

  const runDelete = (
    id: string,
    action: () => Promise<RowActionResult>,
    config: RowActionConfig,
  ): Promise<void> => run(setDeletingId, id, action, config);

  const runToggle = (
    id: string,
    action: () => Promise<RowActionResult>,
    config: RowActionConfig,
  ): Promise<void> => run(setTogglingId, id, action, config);

  return { deletingId, togglingId, runDelete, runToggle };
}
