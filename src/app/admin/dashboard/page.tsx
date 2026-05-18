import type { Metadata } from "next";

import { DashboardStats } from "@/app/admin/components/DashboardStats";
import { getAdminDashboardData } from "@/shared/lib/queries/admin";
import { getAnalyticsData } from "@/shared/lib/queries/analytics";
import AnalyticsDashboard from "@/app/admin/dashboard/AnalyticsDashboard.client";

export const metadata: Metadata = { title: "대시보드" };

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [analyticsData, dashboardData] = await Promise.all([
    getAnalyticsData(),
    getAdminDashboardData(),
  ]);

  return (
    <div className="px-4 py-6 md:p-10">
      <DashboardStats data={dashboardData} />
      <AnalyticsDashboard initialData={analyticsData} />
    </div>
  );
}
