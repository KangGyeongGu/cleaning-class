"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import {
  NaverBlogIcon,
  InstagramIcon,
  DaangnIcon,
} from "@/components/icons/SocialIcons";
import { trackSnsClick, trackSelectContent } from "@/shared/lib/analytics";

interface NavbarProps {
  businessName?: string;
  blogUrl?: string;
  instagramUrl?: string;
  daangnUrl?: string;
}

interface MenuItem {
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: "서비스", href: "/services" },
  { label: "가격표", href: "/price" },
  { label: "작업후기", href: "/reviews" },
  { label: "견적문의", href: "/contact" },
  { label: "자주묻는질문", href: "/help" },
];

function LogoIcon(): React.JSX.Element {
  return (
    <Image
      src="/images/logo-small.png"
      alt=""
      width={28}
      height={28}
      aria-hidden={true}
      className="h-7 w-7 rounded-sm md:h-9 md:w-9"
    />
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Navbar({
  businessName,
  blogUrl,
  instagramUrl,
  daangnUrl,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const displayName = businessName ?? "청소클라쓰";
  const isHome = pathname === "/";

  const hasBlogUrl = blogUrl && blogUrl.trim() !== "";
  const hasInstagramUrl = instagramUrl && instagramUrl.trim() !== "";
  const hasDaangnUrl = daangnUrl && daangnUrl.trim() !== "";

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = (): void => {
    if (isHome) {
      scrollToTop();
    } else {
      router.push("/");
    }
  };

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!overlayRef.current) return [];
    return Array.from(
      overlayRef.current.querySelectorAll<HTMLElement>(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled"));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, getFocusableElements]);

  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
    } else if (hasOpenedRef.current) {
      hamburgerRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <>
      <nav className="sticky top-0 right-0 left-0 z-[60] bg-white/80 py-2.5 backdrop-blur-md md:py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 md:px-6">
          <button
            type="button"
            className="relative flex min-h-10 cursor-pointer items-center gap-1.5 border-0 bg-transparent text-lg font-black tracking-tighter text-slate-900 md:gap-2 md:text-xl"
            aria-label="청소클라쓰 홈으로 이동"
            onClick={handleLogoClick}
          >
            <LogoIcon />
            {displayName}
          </button>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex items-center gap-8">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs font-black tracking-widest text-slate-500 transition-colors hover:text-slate-900"
                  onClick={
                    item.href === "/contact"
                      ? () =>
                          trackSelectContent({
                            content_type: "cta_button",
                            content_id: "navbar_contact",
                          })
                      : undefined
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {(hasBlogUrl || hasInstagramUrl || hasDaangnUrl) && (
              <div className="ml-2 flex items-center gap-4 border-l border-slate-200 pl-6">
                {hasBlogUrl && (
                  <a
                    href={blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="네이버 블로그"
                    title="네이버 블로그"
                    className="text-slate-400 transition-colors hover:text-slate-900"
                    onClick={() =>
                      trackSnsClick({
                        sns_platform: "naver_blog",
                        click_location: "navbar",
                      })
                    }
                  >
                    <NaverBlogIcon size={20} />
                  </a>
                )}
                {hasInstagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="인스타그램"
                    title="인스타그램"
                    className="text-slate-400 transition-colors hover:text-slate-900"
                    onClick={() =>
                      trackSnsClick({
                        sns_platform: "instagram",
                        click_location: "navbar",
                      })
                    }
                  >
                    <InstagramIcon size={20} />
                  </a>
                )}
                {hasDaangnUrl && (
                  <a
                    href={daangnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="당근마켓"
                    title="당근마켓"
                    className="text-slate-400 transition-colors hover:text-slate-900"
                    onClick={() =>
                      trackSnsClick({
                        sns_platform: "daangn",
                        click_location: "navbar",
                      })
                    }
                  >
                    <DaangnIcon size={20} />
                  </a>
                )}
              </div>
            )}
          </div>

          <button
            ref={hamburgerRef}
            type="button"
            aria-label="메뉴 열기/닫기"
            aria-expanded={isOpen}
            className="relative flex h-10 w-10 items-center justify-center text-slate-900 md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="내비게이션 메뉴"
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white transition-opacity duration-200 md:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              setIsOpen(false);

              if (item.href === "/contact") {
                trackSelectContent({
                  content_type: "cta_button",
                  content_id: "navbar_contact",
                });
              }
            }}
            className="text-2xl font-medium tracking-wide text-slate-900"
          >
            {item.label}
          </Link>
        ))}
        {(hasBlogUrl || hasInstagramUrl || hasDaangnUrl) && (
          <div className="mt-2 flex items-center gap-5 border-t border-slate-200 pt-6">
            {hasBlogUrl && (
              <a
                href={blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => {
                  setIsOpen(false);
                  trackSnsClick({
                    sns_platform: "naver_blog",
                    click_location: "navbar",
                  });
                }}
                aria-label="네이버 블로그"
                className="text-slate-400 transition-colors hover:text-slate-900"
              >
                <NaverBlogIcon size={24} />
              </a>
            )}
            {hasInstagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => {
                  setIsOpen(false);
                  trackSnsClick({
                    sns_platform: "instagram",
                    click_location: "navbar",
                  });
                }}
                aria-label="인스타그램"
                className="text-slate-400 transition-colors hover:text-slate-900"
              >
                <InstagramIcon size={24} />
              </a>
            )}
            {hasDaangnUrl && (
              <a
                href={daangnUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => {
                  setIsOpen(false);
                  trackSnsClick({
                    sns_platform: "daangn",
                    click_location: "navbar",
                  });
                }}
                aria-label="당근마켓"
                className="text-slate-400 transition-colors hover:text-slate-900"
              >
                <DaangnIcon size={24} />
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
