import { redirect } from "next/navigation";

export default async function AdminPage(): Promise<never> {
  redirect("/admin/dashboard");
}
