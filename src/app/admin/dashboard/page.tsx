import type { Metadata } from "next";
import Link from "next/link";

import { DashboardStats } from "@/app/admin/components/DashboardStats";
import { DailyTrendChart } from "@/app/admin/dashboard/DailyTrendChart.client";
import { TrafficSourceTable } from "@/app/admin/dashboard/TrafficSourceTable";
import { CustomerActionTable } from "@/app/admin/dashboard/CustomerActionTable";
import { getAdminDashboardData } from "@/shared/lib/queries/admin";
import {
  getDailyTrend7d,
  getTrafficSources30d,
  getCustomerActions30d,
} from "@/shared/lib/queries/dashboard";

export const metadata: Metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [content, trend, sources, actions] = await Promise.all([
    getAdminDashboardData(),
    getDailyTrend7d(),
    getTrafficSources30d(),
    getCustomerActions30d(),
  ]);

  return (
    <div className="px-4 py-6 md:p-10">
      <h1 className="mb-8 text-2xl font-black text-slate-900 md:text-3xl">
        대시보드
      </h1>

      <div className="mb-6 flex gap-4">
        <Link
          href="/admin/traffic"
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          트래픽 분석
        </Link>
        {process.env.ADMIN_GA4_CONSOLE_URL && (
          <a
            href={process.env.ADMIN_GA4_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            GA4 콘솔
          </a>
        )}
        {process.env.ADMIN_CLARITY_CONSOLE_URL && (
          <a
            href={process.env.ADMIN_CLARITY_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            Clarity 콘솔
          </a>
        )}
      </div>

      <DashboardStats data={content} />
      <DailyTrendChart rows={trend} />

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-bold tracking-widest text-slate-500 uppercase">
          최근 30일
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-bold text-slate-600">유입 채널</h3>
            <TrafficSourceTable rows={sources} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold text-slate-600">고객 행동</h3>
            <CustomerActionTable data={actions} />
          </div>
        </div>
      </section>
    </div>
  );
}
