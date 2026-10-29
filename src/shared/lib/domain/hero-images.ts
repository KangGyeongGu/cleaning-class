import { z } from "zod";
import type { Json, SiteConfig } from "@/shared/types/database";

export const heroDeviceSchema = z.enum(["pc", "mobile"]);
export const heroSideSchema = z.enum(["left", "right"]);
export const heroAssetSchema = z
  .object({
    displayPath: z.string().min(1),
    focalX: z.number().min(0).max(100),
    focalY: z.number().min(0).max(100),
  })
  .strict();
const deviceImagesSchema = z
  .object({
    left: heroAssetSchema.nullable(),
    right: heroAssetSchema.nullable(),
  })
  .strict();
export const heroImagesSchema = z
  .object({ pc: deviceImagesSchema, mobile: deviceImagesSchema })
  .strict();
export type HeroDevice = z.infer<typeof heroDeviceSchema>;
export type HeroSide = z.infer<typeof heroSideSchema>;
export interface HeroCrop {
  left: number;
  top: number;
  width: number;
  height: number;
}
export type HeroAsset = z.infer<typeof heroAssetSchema>;
export type HeroImages = z.infer<typeof heroImagesSchema>;
export type HeroConfig = Pick<
  SiteConfig,
  | "hero_images"
  | "hero_image_path"
  | "hero_image_path_2"
  | "hero_image_focal_x"
  | "hero_image_focal_y"
  | "hero_image_focal_x_2"
  | "hero_image_focal_y_2"
>;

export function getHeroImages(config: HeroConfig | null): HeroImages {
  const parsed = heroImagesSchema.safeParse(config?.hero_images);
  if (parsed.success) return parsed.data;
  const legacy = (side: HeroSide): HeroAsset | null => {
    const left = side === "left";
    const path = left ? config?.hero_image_path : config?.hero_image_path_2;
    return path
      ? {
          displayPath: path,
          focalX:
            (left
              ? config?.hero_image_focal_x
              : config?.hero_image_focal_x_2) ?? 50,
          focalY:
            (left
              ? config?.hero_image_focal_y
              : config?.hero_image_focal_y_2) ?? 50,
        }
      : null;
  };
  return {
    pc: { left: legacy("left"), right: legacy("right") },
    mobile: { left: legacy("left"), right: legacy("right") },
  };
}

export function heroAssetJson(asset: HeroAsset | null): Json {
  return asset ? { ...asset } : null;
}

export const HERO_CLIPS = {
  pc: {
    left: "polygon(0 0,91.67% 0,75% 100%,0 100%)",
    right: "polygon(25% 0,100% 0,100% 100%,8.33% 100%)",
  },
  mobile: {
    left: "polygon(0 0,100% 0,0 100%)",
    right: "polygon(100% 0,100% 100%,0 100%)",
  },
} as const;
