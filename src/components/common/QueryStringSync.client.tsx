"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function QueryStringSync({
  onChange,
}: {
  onChange: (search: string) => void;
}) {
  const search = useSearchParams().toString();
  useEffect(() => onChange(search), [search, onChange]);
  return null;
}
