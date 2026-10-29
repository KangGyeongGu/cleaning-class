"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Layers,
  House,
  Image,
  Settings,
  LogOut,
} from "lucide-react";
import { BusinessSettingsDialog } from "@/app/admin/components/BusinessSettingsDialog.client";
import type { SiteConfig } from "@/shared/types/database";
import { getBusinessSettings } from "@/shared/actions/site-config";
import {
  MANAGEMENT_SECTIONS,
  isAdminPathActive,
} from "@/app/admin/lib/navigation";
import { logout } from "@/shared/actions/auth";

const navItems = [
  {
    href: "/admin/dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
    paths: ["/admin/dashboard"],
  },
  {
    href: "/admin/config",
    label: "홈화면 관리",
    icon: House,
    paths: ["/admin/config"],
  },
  {
    href: "/admin/services",
    label: MANAGEMENT_SECTIONS.services.title,
    icon: Layers,
    paths: MANAGEMENT_SECTIONS.services.tabs.map((tab) => tab.href),
  },
  {
    href: "/admin/reviews",
    label: MANAGEMENT_SECTIONS.reviews.title,
    icon: Image,
    paths: MANAGEMENT_SECTIONS.reviews.tabs.map((tab) => tab.href),
  },
];

const navItemBase =
  "flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-widest transition-colors";
const navItemActive = "bg-slate-200/60 text-slate-900";
const navItemInactive =
  "text-slate-500 hover:bg-slate-200/40 hover:text-slate-900";

export function AdminSidebar() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  async function loadSettings() {
    setLoadingSettings(true);
    try {
      setConfig(await getBusinessSettings());
    } catch {
      setConfig(null);
    } finally {
      setLoadingSettings(false);
      setIsSettingsOpen(true);
    }
  }
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 bg-slate-100 md:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="text-heading-2">청소클라쓰 관리자</div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-900"
            aria-label={isSidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <aside className="fixed top-0 left-0 hidden h-screen w-64 flex-col bg-slate-100 md:flex">
        <div className="p-8">
          <div className="mb-12 text-2xl font-black text-slate-900">
            청소클라쓰
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.paths.some((path) =>
                isAdminPathActive(pathname, path),
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded ${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-8 pt-0">
          <button
            type="button"
            onClick={loadSettings}
            disabled={loadingSettings}
            aria-haspopup="dialog"
            className={`mb-1 w-full rounded ${navItemBase} ${navItemInactive}`}
          >
            <Settings size={18} />
            업체 정보
          </button>
          <form action={handleLogout}>
            <button
              type="submit"
              className={`w-full rounded ${navItemBase} ${navItemInactive}`}
            >
              <LogOut size={18} />
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-slate-100 md:hidden">
          <nav className="space-y-1 px-4 pt-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.paths.some((path) =>
                isAdminPathActive(pathname, path),
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`rounded ${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-4 pb-8">
            <button
              type="button"
              onClick={loadSettings}
              disabled={loadingSettings}
              aria-haspopup="dialog"
              className={`mb-1 w-full rounded ${navItemBase} ${navItemInactive}`}
            >
              <Settings size={18} />
              업체 정보
            </button>
            <form action={handleLogout}>
              <button
                type="submit"
                className={`w-full rounded ${navItemBase} ${navItemInactive}`}
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </form>
          </div>
        </div>
      )}
      {isSettingsOpen && (
        <BusinessSettingsDialog
          config={config}
          onRetry={loadSettings}
          loading={loadingSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
}
