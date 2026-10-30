import { Hero } from "@/components/hero/Hero";
import { getUser } from "@/shared/lib/supabase/auth";

export default async function HeroPreviewPage() {
  await getUser();
  return <Hero />;
}
