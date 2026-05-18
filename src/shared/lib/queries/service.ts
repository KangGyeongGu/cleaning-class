import { createClient } from "@/shared/lib/supabase/server";
import { getServiceImageUrl } from "@/shared/lib/supabase/storage";
import type { Service } from "@/shared/types/database";

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

export async function getNextServiceSortOrder(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getNextServiceSortOrder] sort_order 조회 실패:", error);
    }
    return 0;
  }

  return (data?.sort_order ?? -1) + 1;
}
