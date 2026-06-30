"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
  const router = useRouter();

  const selected = versions.find((v) => v.version === selectedVersion);
  if (!selected) return <></>;

  function hrefFor(version: string): string {
    const target = versions.find((v) => v.version === version);
    return target?.current ? basePath : `${basePath}/${version}`;
  }

  return (
    <div className="relative flex w-full max-w-sm items-center border border-slate-200 bg-white px-4 py-2.5 transition-colors focus-within:border-slate-900 hover:border-slate-400">
      <span className="text-label mr-2 text-slate-500">시행 버전</span>
      <select
        value={selectedVersion}
        onChange={(e) => router.push(hrefFor(e.target.value))}
        aria-label="시행 버전 선택"
        className="flex-1 appearance-none bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
      >
        {versions.map((v) => (
          <option key={v.version} value={v.version}>
            {formatPolicyVersionRange(v)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none ml-2 shrink-0 text-slate-500"
        aria-hidden="true"
      />
    </div>
  );
}
