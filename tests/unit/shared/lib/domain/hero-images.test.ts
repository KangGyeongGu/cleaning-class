import { describe, expect, it } from "vitest";
import {
  getHeroImages,
  heroAssetJson,
  type HeroConfig,
} from "@/shared/lib/domain/hero-images";

function legacy(): HeroConfig {
  return {
    hero_images: null,
    hero_image_path: "left.png",
    hero_image_path_2: "right.png",
    hero_image_focal_x: 0,
    hero_image_focal_y: 100,
    hero_image_focal_x_2: 25,
    hero_image_focal_y_2: 75,
  };
}
describe("hero images", () => {
  it("keeps the four targets independent and respects an explicitly empty target", () => {
    const images = {
      pc: {
        left: { displayPath: "pc.webp", focalX: 50, focalY: 50 },
        right: null,
      },
      mobile: {
        left: null,
        right: { displayPath: "mobile.webp", focalX: 50, focalY: 50 },
      },
    };
    expect(getHeroImages({ ...legacy(), hero_images: images })).toEqual(images);
  });
  it("preserves legacy images and focal points before migration", () => {
    const images = getHeroImages(legacy());
    expect(images.pc.left).toEqual({
      displayPath: "left.png",
      focalX: 0,
      focalY: 100,
    });
    expect(images.mobile.right).toEqual({
      displayPath: "right.png",
      focalX: 25,
      focalY: 75,
    });
    expect(images.pc).toEqual(images.mobile);
    expect(images.pc.left).not.toBe(images.mobile.left);
  });
  it("defaults missing legacy focal points to the center", () => {
    const images = getHeroImages({
      ...legacy(),
      hero_image_focal_x: null,
      hero_image_focal_y: null,
      hero_image_focal_x_2: null,
      hero_image_focal_y_2: null,
    });
    expect(images.pc.left).toEqual({
      displayPath: "left.png",
      focalX: 50,
      focalY: 50,
    });
    expect(images.pc.right).toEqual({
      displayPath: "right.png",
      focalX: 50,
      focalY: 50,
    });
  });
  it("handles absent settings and empty legacy image paths", () => {
    const empty = {
      pc: { left: null, right: null },
      mobile: { left: null, right: null },
    };
    expect(getHeroImages(null)).toEqual(empty);
    expect(
      getHeroImages({
        ...legacy(),
        hero_image_path: "",
        hero_image_path_2: null,
      }),
    ).toEqual(empty);
  });
  it("serializes only the stored result metadata", () => {
    const asset = { displayPath: "result.webp", focalX: 50, focalY: 50 };
    expect(heroAssetJson(asset)).toEqual(asset);
    expect(heroAssetJson(null)).toBeNull();
  });
});
