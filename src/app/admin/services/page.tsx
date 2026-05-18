import Link from "next/link";
import { Plus } from "lucide-react";
import { ServiceDescriptionSection } from "@/app/admin/services/ServiceDescriptionSection";
import { ServiceListSection } from "@/app/admin/services/ServiceListSection";

export default async function ServicesPage(): Promise<React.ReactElement> {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="md:text-heading-1 text-lg font-black">서비스 관리</h1>
        <Link
          href="/admin/services/new"
          className="btn-primary flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap md:gap-2 md:px-6 md:py-3 md:text-sm"
        >
          <Plus size={16} className="md:h-[18px] md:w-[18px]" />
          신규 등록
        </Link>
      </div>

      <ServiceDescriptionSection />
      <ServiceListSection />
    </div>
  );
}
