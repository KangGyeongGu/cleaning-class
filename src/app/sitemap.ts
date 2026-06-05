import type { MetadataRoute } from "next";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { SUPABASE_NOT_FOUND_CODE } from "@/shared/lib/pure/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  const [
    { data: serviceData, error: serviceError },
    { data: reviewData, error: reviewError },
    { data: configData, error: configError },
    { data: faqData, error: faqError },
    { data: priceData, error: priceError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("reviews")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single(),
    supabase.from("site_config").select("updated_at").limit(1).single(),
    supabase
      .from("faqs")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("price_items")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (serviceError && serviceError.code !== SUPABASE_NOT_FOUND_CODE)
    console.error("[sitemap] services 조회 실패:", serviceError);
  if (reviewError && reviewError.code !== SUPABASE_NOT_FOUND_CODE)
    console.error("[sitemap] reviews 조회 실패:", reviewError);
  if (configError && configError.code !== SUPABASE_NOT_FOUND_CODE)
    console.error("[sitemap] site_config 조회 실패:", configError);
  if (faqError && faqError.code !== SUPABASE_NOT_FOUND_CODE)
    console.error("[sitemap] faqs 조회 실패:", faqError);
  if (priceError && priceError.code !== SUPABASE_NOT_FOUND_CODE)
    console.error("[sitemap] price_items 조회 실패:", priceError);

  const dates = [
    serviceData?.updated_at,
    reviewData?.updated_at,
    configData?.updated_at,
    faqData?.updated_at,
  ]
    .filter((d): d is string => typeof d === "string")
    .map((d) => new Date(d));

  const lastModified =
    dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime())))
      : new Date();

  return [
    {
      url: "https://www.cleaningclass.co.kr",
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://www.cleaningclass.co.kr/services",
      lastModified: serviceData?.updated_at
        ? new Date(serviceData.updated_at as string)
        : lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.cleaningclass.co.kr/reviews",
      lastModified: reviewData?.updated_at
        ? new Date(reviewData.updated_at as string)
        : lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.cleaningclass.co.kr/contact",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.cleaningclass.co.kr/policy/privacy",
      lastModified: new Date("2026-03-23T00:00:00.000Z"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.cleaningclass.co.kr/policy/terms",
      lastModified: new Date("2026-03-23T00:00:00.000Z"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.cleaningclass.co.kr/help",
      lastModified: faqData?.updated_at
        ? new Date(faqData.updated_at as string)
        : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.cleaningclass.co.kr/price",
      lastModified: priceData?.updated_at
        ? new Date(priceData.updated_at as string)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];
}
