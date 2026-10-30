export function EditorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function PublishField({
  name = "is_published",
  defaultChecked = true,
  label = "공개",
}: {
  name?: string;
  defaultChecked?: boolean;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
      <input
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-slate-900"
      />
      {label}
    </label>
  );
}
