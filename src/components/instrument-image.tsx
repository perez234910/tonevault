"use client";
import Image from "next/image";
import { useState } from "react";

export function InstrumentImage({ src, alt, sizes, reference = false }: { src: string | null; alt: string; sizes: string; reference?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <span role="img" aria-label={`Photograph unavailable for ${alt}`} className="flex h-full items-center justify-center p-4 text-center text-xs text-muted">Photograph unavailable</span>;
  return <Image src={src} alt={reference ? `${alt} — model reference, not the listed instrument` : alt} fill sizes={sizes} className={reference ? "object-contain p-3" : "object-cover"} onError={() => setFailed(src)} />;
}
