import "server-only";

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import {
  cloudflareDaySchema,
  gaGeneralSchema,
  gaPanelItemSchema,
  gaPanelMetaSchema,
  type CloudflareDay,
  type GaGeneral,
  type GaPanelItem,
  type GaPanelMeta,
} from "@/shared/lib/schema/traffic";

const DATA_DIR = process.env.TRAFFIC_DATA_DIR ?? "/data";
const CF_DIR = join(DATA_DIR, "cloudflare");
const GA_REPORT = join(DATA_DIR, "goaccess", "report.json");

export async function getCloudflareDays(): Promise<CloudflareDay[]> {
  let files: string[];
  try {
    files = (await readdir(CF_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const days: CloudflareDay[] = [];
  for (const file of files) {
    try {
      const raw = await readFile(join(CF_DIR, file), "utf-8");
      const parsed = cloudflareDaySchema.safeParse(JSON.parse(raw));
      if (parsed.success) days.push(parsed.data);
    } catch {
      continue;
    }
  }

  return days.sort((a, b) =>
    a.dimensions.date.localeCompare(b.dimensions.date),
  );
}

export type GoAccessReport = {
  general: GaGeneral;
  panels: Record<string, GaPanelItem[]>;
  meta: Record<string, GaPanelMeta>;
};

const GA_PANELS = [
  "requests",
  "static_requests",
  "not_found",
  "hosts",
  "os",
  "browsers",
  "visit_time",
  "referring_sites",
  "status_codes",
] as const;

export async function getGoAccessReport(): Promise<GoAccessReport | null> {
  let root: Record<string, unknown>;
  try {
    root = JSON.parse(await readFile(GA_REPORT, "utf-8"));
  } catch {
    return null;
  }

  const general = gaGeneralSchema.safeParse(root.general);
  const panels: Record<string, GaPanelItem[]> = {};
  const meta: Record<string, GaPanelMeta> = {};

  for (const name of GA_PANELS) {
    const panel = root[name] as
      | { data?: unknown[]; metadata?: unknown }
      | undefined;
    const arr = Array.isArray(panel?.data) ? panel.data : [];
    const items: GaPanelItem[] = [];
    for (const it of arr) {
      const parsed = gaPanelItemSchema.safeParse(it);
      if (parsed.success) items.push(parsed.data);
    }
    panels[name] = items;

    const metaParsed = gaPanelMetaSchema.safeParse(panel?.metadata);
    meta[name] = metaParsed.success ? metaParsed.data : {};
  }

  return { general: general.success ? general.data : {}, panels, meta };
}

export function gaMeta(
  report: GoAccessReport | null,
  panel: string,
): GaPanelMeta {
  return report?.meta[panel] ?? {};
}

export function filterDaysByRange(
  days: CloudflareDay[],
  rangeDays: number | null,
): CloudflareDay[] {
  if (rangeDays === null) return days;
  return days.slice(-rangeDays);
}

export function gaPanel(
  report: GoAccessReport | null,
  panel: string,
  limit: number,
): GaPanelItem[] {
  return (report?.panels[panel] ?? []).slice(0, limit);
}

function mergeBy<T>(
  rows: T[][],
  key: (r: T) => string,
  value: (r: T) => number,
): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const arr of rows) {
    for (const r of arr) {
      m.set(key(r), (m.get(key(r)) ?? 0) + value(r));
    }
  }
  return [...m.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateCloudflare(days: CloudflareDay[]) {
  const totals = days.reduce(
    (acc, d) => {
      acc.requests += d.sum.requests;
      acc.bytes += d.sum.bytes;
      acc.cachedRequests += d.sum.cachedRequests;
      acc.encryptedRequests += d.sum.encryptedRequests;
      acc.pageViews += d.sum.pageViews;
      acc.threats += d.sum.threats;
      acc.uniques += d.uniq?.uniques ?? 0;
      return acc;
    },
    {
      requests: 0,
      bytes: 0,
      cachedRequests: 0,
      encryptedRequests: 0,
      pageViews: 0,
      threats: 0,
      uniques: 0,
    },
  );

  return {
    totals,
    countries: mergeBy(
      days.map((d) => d.sum.countryMap),
      (r) => r.clientCountryName,
      (r) => r.requests,
    ),
    statuses: mergeBy(
      days.map((d) => d.sum.responseStatusMap),
      (r) => String(r.edgeResponseStatus),
      (r) => r.requests,
    ),
    browsers: mergeBy(
      days.map((d) => d.sum.browserMap),
      (r) => r.uaBrowserFamily,
      (r) => r.pageViews,
    ),
    contentTypes: mergeBy(
      days.map((d) => d.sum.contentTypeMap),
      (r) => r.edgeResponseContentTypeName,
      (r) => r.requests,
    ),
    httpVersions: mergeBy(
      days.map((d) => d.sum.clientHTTPVersionMap),
      (r) => r.clientHTTPProtocol,
      (r) => r.requests,
    ),
    ipClasses: mergeBy(
      days.map((d) => d.sum.ipClassMap),
      (r) => r.ipType,
      (r) => r.requests,
    ),
    threatPaths: mergeBy(
      days.map((d) => d.sum.threatPathingMap),
      (r) => r.threatPathingName,
      (r) => r.requests,
    ),
    series: days.map((d) => ({
      date: d.dimensions.date,
      requests: d.sum.requests,
      pageViews: d.sum.pageViews,
      threats: d.sum.threats,
      uniques: d.uniq?.uniques ?? 0,
    })),
  };
}
