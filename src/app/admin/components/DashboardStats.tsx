import type { AdminDashboardData } from "@/shared/lib/queries/admin";

interface DashboardStatsProps {
  data: AdminDashboardData;
}

export function DashboardStats({
  data,
}: DashboardStatsProps): React.ReactElement {
  const items: Array<{ label: string; value: number }> = [
    { label: "서비스", value: data.serviceCount },
    { label: "블로그 리뷰", value: data.reviewCount },
    { label: "고객 리뷰", value: data.customerReviewCount },
    { label: "FAQ", value: data.faqCount },
    { label: "가격표", value: data.priceCount },
  ];

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-bold tracking-widest text-slate-500 uppercase">
        콘텐츠 현황
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {items.map((item) => (
          <div key={item.label} className="border border-slate-200 p-4 md:p-5">
            <p className="text-xs font-light text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
