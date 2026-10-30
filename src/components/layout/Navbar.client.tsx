"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { SocialLinks } from "@/components/social/SocialLinks.client";
import { getSocialLinks } from "@/shared/lib/pure/social-links";
import { track, currentPath } from "@/shared/lib/infra/track";

interface NavbarProps {
  businessName?: string;
  blogUrl?: string;
  cafeUrl?: string;
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
  { label: "작업 사례", href: "/reviews" },
  { label: "온라인 견적", href: "/contact" },
  { label: "자주 묻는 질문", href: "/help" },
];

function LogoIcon(): React.JSX.Element {
  return (
    <Image
      src="/images/logo.png"
      alt=""
      width={48}
      height={48}
      aria-hidden={true}
      className="h-10 w-10 rounded-sm md:h-12 md:w-12"
    />
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Navbar({
  businessName,
  blogUrl,
  cafeUrl,
  instagramUrl,
  daangnUrl,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const displayName = businessName ?? "청소클라쓰";
  const isHome = pathname === "/";

  const socialUrls = {
    blog_url: blogUrl,
    cafe_url: cafeUrl,
    instagram_url: instagramUrl,
    daangn_url: daangnUrl,
  };
  const hasSocialLinks = getSocialLinks(socialUrls).length > 0;

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6">
          <button
            type="button"
            className="relative flex min-h-10 cursor-pointer items-center gap-1.5 justify-self-start border-0 bg-transparent text-lg font-black tracking-tighter whitespace-nowrap text-slate-900 md:gap-2 md:text-xl"
            aria-label="청소클라쓰 홈으로 이동"
            onClick={handleLogoClick}
          >
            <LogoIcon />
            {displayName}
          </button>

          <div className="hidden md:contents">
            <div className="flex items-center gap-4 justify-self-center whitespace-nowrap lg:gap-8">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-block text-xs font-black tracking-widest text-slate-500 transition-[color,scale] duration-200 ease-out hover:scale-105 hover:text-slate-900 motion-reduce:transition-none motion-reduce:hover:scale-100"
                  onClick={
                    item.href === "/contact"
                      ? () =>
                          track({
                            event_type: "cta_click",
                            event_payload: { content_id: "navbar_contact" },
                            path: currentPath(),
                          })
                      : undefined
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {hasSocialLinks && (
              <div className="flex items-center gap-4 justify-self-end border-l border-slate-200 pl-6">
                <SocialLinks urls={socialUrls} location="navbar" />
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
                track({
                  event_type: "cta_click",
                  event_payload: { content_id: "navbar_contact" },
                  path: currentPath(),
                });
              }
            }}
            className="text-2xl font-medium tracking-wide text-slate-900"
          >
            {item.label}
          </Link>
        ))}
        {hasSocialLinks && (
          <div className="mt-2 flex items-center gap-5 border-t border-slate-200 pt-6">
            <SocialLinks
              urls={socialUrls}
              location="navbar"
              size={24}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}
