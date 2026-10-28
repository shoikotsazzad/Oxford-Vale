"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ImageDTO } from "@/lib/types";
import { imageSrc, isPlaceholder } from "@/lib/images";

/** Product gallery: swipeable on mobile (scroll-snap), thumbnails + main image on desktop. */
export function Gallery({ images, name }: { images: ImageDTO[]; name: string }) {
  const list = images.length ? images : [{ url: imageSrc(null), alt: name }];
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    setIndex(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="md:grid md:grid-cols-[4.5rem_1fr] md:gap-4">
      {list.length > 1 && (
        <ul className="order-1 hidden flex-col gap-3 md:flex" aria-label="Product images">
          {list.map((img, i) => (
            <li key={img.url + i}>
              <button type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index}
                className={`relative block aspect-[4/5] w-full overflow-hidden rounded-md bg-sand ring-offset-2 ring-offset-paper ${i === index ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100"}`}>
                <Image src={img.url} alt="" fill sizes="72px" className="object-cover" unoptimized={isPlaceholder(img.url)} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={`relative order-2 ${list.length > 1 ? "" : "md:col-span-2"}`}>
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== index) setIndex(i);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-lg [scrollbar-width:none] md:overflow-hidden"
        >
          {list.map((img, i) => (
            <div key={img.url + i} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sand">
              <Image src={img.url} alt={img.alt || name} fill priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" unoptimized={isPlaceholder(img.url)} />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 md:hidden">
            {list.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} className="flex h-6 w-6 items-center justify-center">
                <span className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
