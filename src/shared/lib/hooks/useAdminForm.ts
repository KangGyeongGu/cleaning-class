"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

type AdminFormAction<State> = (
  state: State | null,
  payload: FormData,
) => State | Promise<State>;

function hasSuccess(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    "success" in state &&
    Boolean((state as { success?: unknown }).success)
  );
}

export function useAdminForm<State>(
  action: AdminFormAction<State>,
  redirectTo: string,
): [State | null, (payload: FormData) => void, boolean] {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<State | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (hasSuccess(state)) {
      router.push(redirectTo);
    }
  }, [state, router, redirectTo]);

  return [state, formAction, isPending];
}
