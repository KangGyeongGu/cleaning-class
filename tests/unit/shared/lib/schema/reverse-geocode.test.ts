import { describe, it, expect } from "vitest";
import {
  reverseGeocodeQuerySchema,
  reverseGeocodeResponseSchema,
} from "@/shared/lib/schema/reverse-geocode";

describe("reverseGeocodeQuerySchema", () => {
  it("parses valid Korean coordinates", () => {
    const r = reverseGeocodeQuerySchema.parse({
      lat: "35.8",
      lng: "127.1",
    });
    expect(r).toEqual({ lat: 35.8, lng: 127.1 });
  });

  it("rejects out-of-range lat", () => {
    expect(
      reverseGeocodeQuerySchema.safeParse({ lat: "10", lng: "127" }).success,
    ).toBe(false);
  });

  it("rejects out-of-range lng", () => {
    expect(
      reverseGeocodeQuerySchema.safeParse({ lat: "35", lng: "100" }).success,
    ).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(
      reverseGeocodeQuerySchema.safeParse({ lat: "abc", lng: "127" }).success,
    ).toBe(false);
  });
});

describe("reverseGeocodeResponseSchema", () => {
  it("accepts non-empty address", () => {
    const r = reverseGeocodeResponseSchema.safeParse({
      address: "전북 전주시",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty address", () => {
    expect(
      reverseGeocodeResponseSchema.safeParse({ address: "" }).success,
    ).toBe(false);
  });
});
