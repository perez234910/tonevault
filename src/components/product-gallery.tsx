"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<number[]>([]);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = images[active];
  function select(index: number, focus = false) {
    setActive(index);
    if (focus) buttons.current[index]?.focus();
  }
  if (!current) return <div role="img" aria-label={`No photographs available for ${alt}`} className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-line bg-panel text-muted">No photography on file</div>;
  return (
    <section aria-label="Instrument photographs" className="min-w-0 space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-panel">
        {failed.includes(active) ? <div role="img" aria-label={`Photograph ${active + 1} unavailable`} className="flex h-full items-center justify-center px-4 text-center text-muted">This photograph is unavailable. Try another view.</div> : (
          <Image src={current} alt={`${alt}, photo ${active + 1} of ${images.length}`} fill priority sizes="(min-width: 1280px) 576px, (min-width: 1024px) 50vw, 100vw" className="object-cover" onError={() => setFailed((previous) => previous.includes(active) ? previous : [...previous, active])} />
        )}
      </div>
      {images.length > 1 ? <>
        <div className="flex items-center justify-between gap-4">
          <p role="status" className="text-xs text-muted">Photo {active + 1} of {images.length}</p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous photograph" onClick={() => select((active - 1 + images.length) % images.length)} className="h-11 rounded-full border border-line px-4 text-sm text-gold-soft">←</button>
            <button type="button" aria-label="Next photograph" onClick={() => select((active + 1) % images.length)} className="h-11 rounded-full border border-line px-4 text-sm text-gold-soft">→</button>
          </div>
        </div>
        <div role="group" aria-label="Choose a photograph; use arrow keys, Home or End" className="flex gap-2 overflow-x-auto p-1">
          {images.map((image, index) => (
            <button key={`${image}-${index}`} ref={(element) => { buttons.current[index] = element; }} type="button" aria-label={`Show photo ${index + 1} of ${alt}`} aria-pressed={index === active} onClick={() => select(index)}
              onKeyDown={(event) => {
                let next: number | undefined;
                if (event.key === "ArrowRight") next = (index + 1) % images.length;
                if (event.key === "ArrowLeft") next = (index - 1 + images.length) % images.length;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = images.length - 1;
                if (next !== undefined) { event.preventDefault(); select(next, true); }
              }}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${index === active ? "border-gold" : "border-line"}`}>
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      </> : null}
    </section>
  );
}
