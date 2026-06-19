import { GoogleAnalytics } from "@next/third-parties/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar.client";
import { MobilePhoneButton } from "@/components/layout/MobilePhoneButton.client";
import { getSiteConfig } from "@/shared/lib/domain/site-config";
import ClarityInit from "@/components/analytics/ClarityInit.client";

export const revalidate = 3600;

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({
  children,
}: PublicLayoutProps): Promise<React.ReactElement> {
  const siteConfig = await getSiteConfig();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      <Navbar
        businessName={siteConfig?.business_name}
        blogUrl={siteConfig?.blog_url}
        instagramUrl={siteConfig?.instagram_url}
        daangnUrl={siteConfig?.daangn_url}
      />
      <main>{children}</main>
      <Footer siteConfig={siteConfig} />
      {siteConfig?.phone && (
        <MobilePhoneButton
          phone={siteConfig.phone}
          movingPhone={siteConfig.moving_phone ?? undefined}
        />
      )}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      <ClarityInit />
    </>
  );
}
