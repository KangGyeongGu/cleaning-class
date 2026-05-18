import Link from "next/link";

import type { SiteConfig } from "@/shared/types/database";
import {
  NaverBlogIcon,
  InstagramIcon,
  DaangnIcon,
} from "@/components/icons/SocialIcons";
import TrackedPhoneLink from "@/components/analytics/TrackedPhoneLink.client";
import TrackedSnsLink from "@/components/analytics/TrackedSnsLink.client";

interface FooterProps {
  siteConfig: SiteConfig | null;
}

export function Footer({ siteConfig }: FooterProps) {
  const businessName = siteConfig?.business_name ?? "청소클라쓰";
  const phone = siteConfig?.phone ?? "";
  const email = siteConfig?.email ?? "";
  const blogUrl = siteConfig?.blog_url;
  const instagramUrl = siteConfig?.instagram_url;
  const daangnUrl = siteConfig?.daangn_url;
  const businessRegistrationNumber =
    siteConfig?.business_registration_number ?? "";
  const representative = siteConfig?.representative ?? "";
  const address = siteConfig?.address ?? "";

  const movingRepresentative = siteConfig?.moving_representative ?? "";
  const movingPhone = siteConfig?.moving_phone ?? "";
  const movingBusinessRegistrationNumber =
    siteConfig?.moving_business_registration_number ?? "";
  const movingAddress = siteConfig?.moving_address ?? "";
  const hasMovingInfo = movingRepresentative.trim() !== "";

  const hasBlogUrl = blogUrl && blogUrl.trim() !== "";
  const hasInstagramUrl = instagramUrl && instagramUrl.trim() !== "";
  const hasDaangnUrl = daangnUrl && daangnUrl.trim() !== "";

  return (
    <footer className="bg-white text-slate-900">
      <div className="container mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-12">
        <p className="text-heading-1 mb-12 tracking-tighter">{businessName}</p>

        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-[auto_auto]">
          <div className="grid grid-cols-[auto_1fr] gap-x-8">
            <p className="text-label text-slate-900">Contact</p>
            <div
              className={
                hasMovingInfo
                  ? "grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-0"
                  : ""
              }
            >
              <div>
                <p className="mb-1.5 text-sm font-bold text-slate-900">청소</p>
                <ul className="space-y-0.5 text-sm font-light whitespace-nowrap text-slate-600">
                  {representative && <li>대표 {representative}</li>}
                  {businessRegistrationNumber && (
                    <li>사업자등록번호 {businessRegistrationNumber}</li>
                  )}
                  {phone && (
                    <li>
                      <TrackedPhoneLink
                        href={`tel:${phone}`}
                        phoneType="cleaning"
                        location="footer"
                        className="transition-colors hover:text-slate-900"
                      >
                        {phone}
                      </TrackedPhoneLink>
                    </li>
                  )}
                  {email && (
                    <li>
                      <a
                        href={`mailto:${email}`}
                        className="transition-colors hover:text-slate-900"
                      >
                        {email}
                      </a>
                    </li>
                  )}
                  {address && <li className="whitespace-normal">{address}</li>}
                </ul>
              </div>

              {hasMovingInfo && (
                <div>
                  <p className="mb-1.5 text-sm font-bold text-slate-900">
                    이사
                  </p>
                  <ul className="space-y-0.5 text-sm font-light whitespace-nowrap text-slate-600">
                    <li>대표 {movingRepresentative}</li>
                    {movingBusinessRegistrationNumber && (
                      <li>사업자등록번호 {movingBusinessRegistrationNumber}</li>
                    )}
                    {movingPhone && (
                      <li>
                        <TrackedPhoneLink
                          href={`tel:${movingPhone}`}
                          phoneType="moving"
                          location="footer"
                          className="transition-colors hover:text-slate-900"
                        >
                          {movingPhone}
                        </TrackedPhoneLink>
                      </li>
                    )}
                    {movingAddress && (
                      <li className="whitespace-normal">{movingAddress}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-8">
            <p className="text-label text-slate-900">Social</p>
            <ul className="space-y-3 text-sm font-light text-slate-600">
              {hasBlogUrl && (
                <li>
                  <TrackedSnsLink
                    href={blogUrl!}
                    platform="naver_blog"
                    location="footer"
                    className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-slate-900 md:min-h-0"
                    ariaLabel="네이버 블로그"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <NaverBlogIcon size={16} />
                    </span>
                    블로그
                  </TrackedSnsLink>
                </li>
              )}
              {hasInstagramUrl && (
                <li>
                  <TrackedSnsLink
                    href={instagramUrl!}
                    platform="instagram"
                    location="footer"
                    className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-slate-900 md:min-h-0"
                    ariaLabel="인스타그램"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <InstagramIcon size={16} />
                    </span>
                    인스타그램
                  </TrackedSnsLink>
                </li>
              )}
              {hasDaangnUrl && (
                <li>
                  <TrackedSnsLink
                    href={daangnUrl!}
                    platform="daangn"
                    location="footer"
                    className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-slate-900 md:min-h-0"
                    ariaLabel="당근마켓"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <DaangnIcon size={16} />
                    </span>
                    당근
                  </TrackedSnsLink>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center gap-0 pt-8 text-xs font-light text-slate-400">
          <span>&copy; 청소클라쓰</span>
          <span className="mx-3 select-none">|</span>
          <Link
            href="/policy/privacy"
            className="transition-colors hover:text-slate-700"
          >
            개인정보처리방침
          </Link>
          <span className="mx-3 select-none">|</span>
          <Link
            href="/policy/terms"
            className="transition-colors hover:text-slate-700"
          >
            이용약관
          </Link>
          <span className="mx-3 select-none">|</span>
          <Link href="/help" className="transition-colors hover:text-slate-700">
            고객센터
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 py-3">
        <p className="text-center text-[10px] tracking-wider text-slate-400">
          Designed by 노마드랩스
        </p>
      </div>
    </footer>
  );
}
