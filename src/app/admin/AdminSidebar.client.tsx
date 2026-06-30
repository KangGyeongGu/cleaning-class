"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Layers,
  Image,
  Settings,
  LogOut,
  ExternalLink,
  HelpCircle,
  Star,
  Tag,
} from "lucide-react";
import { logout } from "@/shared/actions/auth";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/config", label: "업체 정보", icon: Settings },
  { href: "/admin/services", label: "서비스 관리", icon: Layers },
  { href: "/admin/reviews", label: "작업후기 관리", icon: Image },
  { href: "/admin/faq", label: "FAQ 관리", icon: HelpCircle },
  { href: "/admin/price", label: "가격표 관리", icon: Tag },
  { href: "/admin/customer-reviews", label: "고객리뷰 관리", icon: Star },
];

const navItemBase =
  "flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-widest transition-colors";
const navItemActive = "bg-slate-200/60 text-slate-900";
const navItemInactive =
  "text-slate-500 hover:bg-slate-200/40 hover:text-slate-900";

export function AdminSidebar() {
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
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded ${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              target="_blank"
              className={`mt-4 rounded ${navItemBase} ${navItemInactive}`}
            >
              <ExternalLink size={18} />
              홈페이지
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-8 pt-0">
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
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`rounded ${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              target="_blank"
              onClick={() => setIsSidebarOpen(false)}
              className={`mt-4 rounded ${navItemBase} ${navItemInactive}`}
            >
              <ExternalLink size={18} />
              홈페이지
            </Link>
          </nav>
          <div className="mt-auto px-4 pb-8">
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
    </>
  );
}
