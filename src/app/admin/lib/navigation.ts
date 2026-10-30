export const MANAGEMENT_SECTIONS = {
  services: {
    title: "서비스 관리",
    tabs: [
      { href: "/admin/services", label: "서비스 종류" },
      { href: "/admin/price", label: "가격표" },
      { href: "/admin/faq", label: "자주 묻는 질문" },
    ],
  },
  reviews: {
    title: "작업 사례 관리",
    tabs: [
      { href: "/admin/reviews", label: "작업 사례" },
      { href: "/admin/customer-reviews", label: "고객 리뷰" },
    ],
  },
} as const;

export function isAdminPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
