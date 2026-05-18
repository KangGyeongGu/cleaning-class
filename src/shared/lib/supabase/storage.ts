interface ImageTransformOptions {
  width?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png" | "origin";
}

function buildTransformUrl(
  baseUrl: string,
  options: ImageTransformOptions,
): string {
  const url = new URL(baseUrl);
  url.pathname = url.pathname.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );

  if (options.width !== undefined)
    url.searchParams.set("width", String(options.width));
  if (options.quality !== undefined)
    url.searchParams.set("quality", String(options.quality));
  if (options.format !== undefined)
    url.searchParams.set("format", options.format);

  return url.toString();
}

export function getReviewImageUrl(
  imagePath: string,
  transform?: ImageTransformOptions,
): string {
  if (!imagePath || imagePath.trim() === "") {
    return "/images/reviews/placeholder.webp";
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  const rawUrl = `${supabaseUrl}/storage/v1/object/public/review-images/${imagePath}`;
  return transform ? buildTransformUrl(rawUrl, transform) : rawUrl;
}

export function getServiceImageUrl(
  imagePath: string,
  transform?: ImageTransformOptions,
): string {
  if (!imagePath || imagePath.trim() === "") {
    return "";
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  const rawUrl = `${supabaseUrl}/storage/v1/object/public/service-images/${imagePath}`;
  return transform ? buildTransformUrl(rawUrl, transform) : rawUrl;
}

export function getHeroImageUrl(
  imagePath: string,
  transform?: ImageTransformOptions,
): string {
  if (!imagePath || imagePath.trim() === "") {
    return "";
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  const rawUrl = `${supabaseUrl}/storage/v1/object/public/hero-images/${imagePath}`;
  return transform ? buildTransformUrl(rawUrl, transform) : rawUrl;
}
