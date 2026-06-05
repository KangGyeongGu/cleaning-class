import type { Metadata } from "next";

import { DashboardStats } from "@/app/admin/components/DashboardStats";
import { TodayStats } from "@/app/admin/dashboard/TodayStats";
import { QuoteFunnelTable } from "@/app/admin/dashboard/QuoteFunnelTable";
import { TrafficSourceTable } from "@/app/admin/dashboard/TrafficSourceTable";
import { EventCountTable } from "@/app/admin/dashboard/EventCountTable";
import { getAdminDashboardData } from "@/shared/lib/queries/admin";
import {
  getTodayStats,
  getQuoteFunnel7d,
  getTrafficSources30d,
  getEventCounts30d,
} from "@/shared/lib/queries/dashboard";

export const metadata: Metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [content, today, funnel, sources, events] = await Promise.all([
    getAdminDashboardData(),
    getTodayStats(),
    getQuoteFunnel7d(),
    getTrafficSources30d(),
    getEventCounts30d(),
  ]);

  return (
    <div className="px-4 py-6 md:p-10">
      <DashboardStats data={content} />
      <TodayStats data={today} />
      <QuoteFunnelTable rows={funnel} />
      <TrafficSourceTable rows={sources} />
      <EventCountTable rows={events} />
    </div>
  );
}
