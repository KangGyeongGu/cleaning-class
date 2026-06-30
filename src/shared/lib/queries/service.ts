import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { DEFAULT_FOCAL_POINT } from "@/shared/lib/pure/constants";
import { getNextOrder } from "@/shared/lib/queries/order";
import { getServiceImageUrl } from "@/shared/lib/supabase/storage";
import type { Service } from "@/shared/types/database";

export type ServiceWithImageUrls = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
  focalX: number;
  focalY: number;
  afterFocalX: number;
  afterFocalY: number;
  created_at: string;
  updated_at: string;
};

function mapServiceWithImageUrls(s: Service): ServiceWithImageUrls {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    tags: s.tags ?? [],
    imageUrl: getServiceImageUrl(s.image_path),
    afterImageUrl: s.image_after_path
      ? getServiceImageUrl(s.image_after_path)
      : undefined,
    detailImageUrl: s.detail_image_path
      ? getServiceImageUrl(s.detail_image_path)
      : undefined,
    detailAfterImageUrl: s.detail_image_after_path
      ? getServiceImageUrl(s.detail_image_after_path)
      : undefined,
    focalX: s.image_focal_x,
    focalY: s.image_focal_y,
    afterFocalX: s.image_after_focal_x ?? DEFAULT_FOCAL_POINT,
    afterFocalY: s.image_after_focal_y ?? DEFAULT_FOCAL_POINT,
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

export interface ServiceWithImageUrl extends Service {
  imageUrl: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
}

export async function getServices(): Promise<ServiceWithImageUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getServices] 서비스 목록 조회 실패:", error);
    return [];
  }

  return ((data as Service[]) ?? []).map((service) => ({
    ...service,
    imageUrl: getServiceImageUrl(service.image_path),
    afterImageUrl: service.image_after_path
      ? getServiceImageUrl(service.image_after_path)
      : undefined,
    detailImageUrl: service.detail_image_path
      ? getServiceImageUrl(service.detail_image_path)
      : undefined,
    detailAfterImageUrl: service.detail_image_after_path
      ? getServiceImageUrl(service.detail_image_after_path)
      : undefined,
  }));
}

export async function getServiceById(
  id: string,
): Promise<ServiceWithImageUrl | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error) {
      console.error(`[getServiceById] 서비스 조회 실패 (id=${id}):`, error);
    }
    return null;
  }

  const service = data as Service;
  return {
    ...service,
    imageUrl: getServiceImageUrl(service.image_path),
    afterImageUrl: service.image_after_path
      ? getServiceImageUrl(service.image_after_path)
      : undefined,
    detailImageUrl: service.detail_image_path
      ? getServiceImageUrl(service.detail_image_path)
      : undefined,
    detailAfterImageUrl: service.detail_image_after_path
      ? getServiceImageUrl(service.detail_image_after_path)
      : undefined,
  };
}

export async function getPublishedServicesWithImageUrls(
  category?: "cleaning" | "moving",
): Promise<ServiceWithImageUrls[]> {
  try {
    const supabase = createStaticClient();
    let query = supabase
      .from("services")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (category) query = query.eq("category", category);

    const { data, error } = await query;

    if (error) {
      console.error("[getPublishedServicesWithImageUrls] DB error:", error);
      return [];
    }

    return ((data as Service[] | null) ?? []).map(mapServiceWithImageUrls);
  } catch (err) {
    console.error("[getPublishedServicesWithImageUrls] Unexpected error:", err);
    return [];
  }
}

export async function getNextServiceSortOrder(): Promise<number> {
  return getNextOrder("services", "sort_order");
}
