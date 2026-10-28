"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** next/image that renders `fallback` instead when the file is missing (brand photos are added by the developer later). */
const BRAND_FILES = new Set((process.env.NEXT_PUBLIC_BRAND_FILES ?? "").split("|").filter(Boolean));
const missingBrandFile = (src: ImageProps["src"]) => typeof src === "string" && src.startsWith("/brand/") && !BRAND_FILES.has(src.slice("/brand/".length));

export function BrandImage({ fallback = null, ...props }: ImageProps & { fallback?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src || missingBrandFile(props.src)) return <>{fallback}</>;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} onError={() => setFailed(true)} />;
}
