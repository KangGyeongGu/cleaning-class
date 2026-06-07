import { z } from "zod";

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(33).max(39),
  lng: z.coerce.number().min(124).max(132),
});

export type ReverseGeocodeQuery = z.infer<typeof reverseGeocodeQuerySchema>;

export const reverseGeocodeResponseSchema = z.object({
  address: z.string().min(1),
});

export type ReverseGeocodeResponse = z.infer<
  typeof reverseGeocodeResponseSchema
>;
