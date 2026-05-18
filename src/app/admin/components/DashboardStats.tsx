import type { AdminDashboardData } from "@/shared/lib/queries/admin";

interface DashboardStatsProps {
  data: AdminDashboardData;
}

export function DashboardStats({
  data,
}: DashboardStatsProps): React.ReactElement {
  return (
    <div className="mb-8 grid grid-cols-3 gap-3 md:mb-12 md:gap-6">
      <div className="border border-slate-200 p-3 md:p-6">
        <p className="text-label mb-1 text-slate-500 md:mb-2">서비스</p>
        <p className="text-2xl font-black text-slate-900 md:text-4xl">
          {data.serviceCount}
        </p>
      </div>
      <div className="border border-slate-200 p-3 md:p-6">
        <p className="text-label mb-1 text-slate-500 md:mb-2">리뷰</p>
        <p className="text-2xl font-black text-slate-900 md:text-4xl">
          {data.reviewCount}
        </p>
      </div>
      <div className="border border-slate-200 p-3 md:p-6">
        <p className="text-label mb-1 text-slate-500 md:mb-2">FAQ</p>
        <p className="text-2xl font-black text-slate-900 md:text-4xl">
          {data.faqCount}
        </p>
      </div>
    </div>
  );
}
