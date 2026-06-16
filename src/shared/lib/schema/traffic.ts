import { z } from "zod";

const cfCountrySchema = z.object({
  clientCountryName: z.string(),
  requests: z.number(),
  bytes: z.number(),
  threats: z.number(),
});

const cfStatusSchema = z.object({
  edgeResponseStatus: z.number(),
  requests: z.number(),
});

const cfBrowserSchema = z.object({
  uaBrowserFamily: z.string(),
  pageViews: z.number(),
});

const cfContentTypeSchema = z.object({
  edgeResponseContentTypeName: z.string(),
  requests: z.number(),
  bytes: z.number(),
});

const cfHttpVersionSchema = z.object({
  clientHTTPProtocol: z.string(),
  requests: z.number(),
});

const cfIpClassSchema = z.object({
  ipType: z.string(),
  requests: z.number(),
});

const cfThreatPathingSchema = z.object({
  threatPathingName: z.string(),
  requests: z.number(),
});

export const cloudflareDaySchema = z.object({
  dimensions: z.object({ date: z.string() }),
  uniq: z.object({ uniques: z.number() }).optional(),
  sum: z.object({
    requests: z.number().default(0),
    bytes: z.number().default(0),
    cachedRequests: z.number().default(0),
    cachedBytes: z.number().default(0),
    encryptedRequests: z.number().default(0),
    pageViews: z.number().default(0),
    threats: z.number().default(0),
    countryMap: z.array(cfCountrySchema).default([]),
    responseStatusMap: z.array(cfStatusSchema).default([]),
    browserMap: z.array(cfBrowserSchema).default([]),
    contentTypeMap: z.array(cfContentTypeSchema).default([]),
    clientHTTPVersionMap: z.array(cfHttpVersionSchema).default([]),
    ipClassMap: z.array(cfIpClassSchema).default([]),
    threatPathingMap: z.array(cfThreatPathingSchema).default([]),
  }),
});

export type CloudflareDay = z.infer<typeof cloudflareDaySchema>;

const gaCount = z.object({
  count: z.number(),
  percent: z.string().optional(),
});

export const gaPanelItemSchema = z.object({
  hits: gaCount.optional(),
  visitors: gaCount.optional(),
  bytes: gaCount.optional(),
  method: z.string().optional(),
  protocol: z.string().optional(),
  data: z
    .union([z.string(), z.number().transform((v) => String(v))])
    .optional(),
});

export const gaGeneralSchema = z
  .object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    total_requests: z.number().optional(),
    valid_requests: z.number().optional(),
    failed_requests: z.number().optional(),
    generation_time: z.number().optional(),
    unique_visitors: z.number().optional(),
    unique_files: z.number().optional(),
    unique_static_files: z.number().optional(),
    unique_not_found: z.number().optional(),
    unique_referrers: z.number().optional(),
    excluded_hits: z.number().optional(),
    log_size: z.number().optional(),
    bandwidth: z.number().optional(),
  })
  .partial();

const gaMetaValue = z.object({
  value: z.number(),
  percent: z.string().optional(),
});

const gaMetaMetric = z
  .object({
    total: gaMetaValue.optional(),
    avg: gaMetaValue.optional(),
    max: gaMetaValue.optional(),
    min: gaMetaValue.optional(),
  })
  .partial();

export const gaPanelMetaSchema = z
  .object({
    hits: gaMetaMetric.optional(),
    visitors: gaMetaMetric.optional(),
    bytes: gaMetaMetric.optional(),
  })
  .partial();

export type GaGeneral = z.infer<typeof gaGeneralSchema>;
export type GaPanelItem = z.infer<typeof gaPanelItemSchema>;
export type GaPanelMeta = z.infer<typeof gaPanelMetaSchema>;
