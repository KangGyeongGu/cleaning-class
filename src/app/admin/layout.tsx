import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps): React.ReactElement {
  return <div className="min-h-screen bg-white">{children}</div>;
}
