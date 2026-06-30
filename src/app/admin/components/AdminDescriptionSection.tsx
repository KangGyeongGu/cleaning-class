import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { InlineDescriptionEditor } from "@/app/admin/components/InlineDescriptionEditor.client";
import type { SiteConfig } from "@/shared/types/database";

type DescriptionField = {
  [K in keyof SiteConfig]: K extends `${string}_description` ? K : never;
}[keyof SiteConfig];

interface AdminDescriptionSectionProps {
  field: DescriptionField;
  placeholder: string;
  emptyText: string;
  onSave: (value: string) => Promise<{ success: boolean; error?: string }>;
}

export async function AdminDescriptionSection({
  field,
  placeholder,
  emptyText,
  onSave,
}: AdminDescriptionSectionProps): Promise<React.ReactElement> {
  const siteConfig = await getSiteConfig();

  return (
    <InlineDescriptionEditor
      initialValue={siteConfig?.[field] ?? ""}
      placeholder={placeholder}
      emptyText={emptyText}
      onSave={onSave}
    />
  );
}
