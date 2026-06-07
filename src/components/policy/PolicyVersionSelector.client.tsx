"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import {
  formatPolicyVersionRange,
  type PolicyVersion,
} from "@/shared/lib/domain/policy-versions";

interface PolicyVersionSelectorProps {
  versions: readonly PolicyVersion[];
  selectedVersion: string;
  basePath: string;
}

export function PolicyVersionSelector({
  versions,
  selectedVersion,
  basePath,
}: PolicyVersionSelectorProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const selected = versions.find((v) => v.version === selectedVersion);
  if (!selected) return <></>;

  function hrefFor(version: PolicyVersion): string {
    return version.current ? basePath : `${basePath}/${version.version}`;
  }

  return (
    <div ref={containerRef} className="relative inline-block w-full max-w-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-900 transition-colors hover:border-slate-400 focus:border-slate-900 focus:outline-none"
      >
        <span>
          <span className="mr-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            시행 버전
          </span>
          {formatPolicyVersionRange(selected)}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto border border-slate-200 bg-white shadow-lg"
        >
          {versions.map((v) => {
            const isSelected = v.version === selectedVersion;
            return (
              <li key={v.version} role="option" aria-selected={isSelected}>
                <Link
                  href={hrefFor(v)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                    isSelected
                      ? "font-medium text-slate-900"
                      : "font-light text-slate-600"
                  }`}
                >
                  <span>{formatPolicyVersionRange(v)}</span>
                  {isSelected && (
                    <Check size={14} aria-hidden="true" className="shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
