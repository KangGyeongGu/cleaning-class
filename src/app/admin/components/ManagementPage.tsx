import Link from "next/link";
import { Plus } from "lucide-react";
import { MANAGEMENT_SECTIONS } from "@/app/admin/lib/navigation";

interface Props {
  section: keyof typeof MANAGEMENT_SECTIONS;
  active: string;
  createHref?: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

export function ManagementPage({
  section,
  active,
  createHref,
  description,
  children,
}: Props) {
  const group = MANAGEMENT_SECTIONS[section];
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-black text-slate-900 md:text-2xl">
          {group.title}
        </h1>
        {createHref && (
          <Link
            href={createHref}
            className="btn-primary inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs md:text-sm"
          >
            <Plus size={16} aria-hidden="true" />
            신규 등록
          </Link>
        )}
      </header>
      <nav
        aria-label={`${group.title} 메뉴`}
        className="mb-5 flex gap-6 overflow-x-auto border-b border-slate-200"
      >
        {group.tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active === tab.href ? "page" : undefined}
            className={`shrink-0 border-b-2 pb-3 text-sm font-bold transition-colors ${active === tab.href ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {description}
      {children}
    </div>
  );
}
