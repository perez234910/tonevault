"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "./ui/icon";

export function ProductGallery({ images, alt, reference = false }: { images: string[]; alt: string; reference?: boolean }) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(0);
  const [loaded, setLoaded] = useState<number[]>([]);
  const [failed, setFailed] = useState<number[]>([]);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function select(index: number, focus = false) {
    setActive(index);
    if (loaded.includes(index) || failed.includes(index)) setVisible(index);
    if (focus) buttons.current[index]?.focus();
  }
  if (!images.length) return <div role="img" aria-label={`No photographs available for ${alt}`} className="flex aspect-[4/5] items-center justify-center bg-panel text-sm text-muted">No photography on file</div>;
  const pending = !loaded.includes(active) && !failed.includes(active);
  return <section aria-label="Instrument photographs" className="min-w-0 space-y-4">
    <div className="gallery-frame" aria-busy={pending}>
      {images.map((image, index) => failed.includes(index) ? (visible === index ? <div key={`${image}-${index}`} role="img" aria-label={`Photograph ${index + 1} unavailable`} className="gallery-fallback">This photograph is unavailable. Try another view.</div> : null) : (
        <Image key={`${image}-${index}`} src={image} alt={index === active ? `${alt}, photo ${index + 1} of ${images.length}` : ""} aria-hidden={index !== active} fill priority={index === 0} sizes="(min-width: 1280px) 576px, (min-width: 1024px) 50vw, 100vw" className={`gallery-image ${reference ? "!object-contain p-5" : ""}`} data-visible={index === visible && loaded.includes(index)}
          onLoad={() => { setLoaded((previous) => previous.includes(index) ? previous : [...previous, index]); if (index === active) setVisible(index); }}
          onError={() => { setFailed((previous) => previous.includes(index) ? previous : [...previous, index]); if (index === active) setVisible(index); }} />
      ))}
      {pending ? <span role="status" className="absolute bottom-3 left-3 bg-background/95 px-3 py-2 text-xs text-muted">Loading photograph…</span> : null}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-xs text-muted">Photo {active + 1} of {images.length}</p>
      {images.length > 1 ? <div className="flex gap-2"><button type="button" aria-label="Previous photograph" onClick={() => select((active - 1 + images.length) % images.length)} className="ui-icon-button"><Icon name="arrow" size={15} style={{ transform: "rotate(180deg)" }} /></button><button type="button" aria-label="Next photograph" onClick={() => select((active + 1) % images.length)} className="ui-icon-button"><Icon name="arrow" size={15} /></button></div> : null}
    </div>
    {images.length > 1 ? <div role="group" aria-label="Choose a photograph; use arrow keys, Home or End" className="flex gap-3 overflow-x-auto p-1">
      {images.map((image, index) => <button key={`${image}-${index}`} ref={(element) => { buttons.current[index] = element; }} type="button" aria-label={`Show photo ${index + 1} of ${alt}`} aria-pressed={index === active} onClick={() => select(index)} onKeyDown={(event) => {
        let next: number | undefined;
        if (event.key === "ArrowRight") next = (index + 1) % images.length;
        if (event.key === "ArrowLeft") next = (index - 1 + images.length) % images.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = images.length - 1;
        if (next !== undefined) { event.preventDefault(); select(next, true); }
      }} className="gallery-thumbnail"><Image src={image} alt="" fill sizes="72px" className={reference ? "object-contain" : "object-cover"} /></button>)}
    </div> : null}
    <p className="text-[10px] leading-5 text-muted">{reference ? "Model reference only; not a photograph of this vintage listing or verification evidence." : "Refer to listing notes for documented condition."}</p>
  </section>;
}
