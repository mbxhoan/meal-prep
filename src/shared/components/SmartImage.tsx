"use client";

import Image from "next/image";
import type { CSSProperties, HTMLAttributeReferrerPolicy } from "react";

type SmartImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  referrerPolicy?: HTMLAttributeReferrerPolicy;
  style?: CSSProperties;
};

function isLocalAsset(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

export default function SmartImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className,
  priority = false,
  loading = "lazy",
  referrerPolicy = "no-referrer",
  style,
}: SmartImageProps) {
  if (!src) {
    return null;
  }

  if (isLocalAsset(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        className={className}
        priority={priority}
        style={style}
      />
    );
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : loading}
        referrerPolicy={referrerPolicy}
        className={`absolute inset-0 h-full w-full ${className ?? ""}`.trim()}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : loading}
      referrerPolicy={referrerPolicy}
      className={className}
      style={style}
    />
  );
}
