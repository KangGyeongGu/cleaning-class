import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminDescriptionSection } from "@/app/admin/components/AdminDescriptionSection";
import { PriceListSection } from "@/app/admin/(protected)/price/PriceListSection";
import { updatePriceDescription } from "@/shared/actions/site-config";

export default async function AdminPricePage(): Promise<React.ReactElement> {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="md:text-heading-1 text-lg font-black">가격표 관리</h1>
        <Link
          href="/admin/price/new"
          className="btn-primary flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap md:gap-2 md:px-6 md:py-3 md:text-sm"
        >
          <Plus size={16} className="md:h-[18px] md:w-[18px]" />
          신규 등록
        </Link>
      </div>

      <AdminDescriptionSection
        field="price_description"
        placeholder="가격표 안내 문구를 입력하세요"
        emptyText="가격표 안내 문구가 없습니다."
        onSave={updatePriceDescription}
      />
      <PriceListSection />
    </div>
  );
}
