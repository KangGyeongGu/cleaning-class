import { AdminSidebar } from "@/app/admin/AdminSidebar.client";
import { getUser } from "@/shared/lib/supabase/auth";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps): Promise<React.ReactElement> {
  await getUser();

  return (
    <>
      <AdminSidebar />
      <main className="pt-16 md:ml-64 md:pt-0">{children}</main>
    </>
  );
}
