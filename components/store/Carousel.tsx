"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

/** Horizontal snap-scrolling row with previous/next buttons. Children are the slides. */
export function Carousel({ children, label, prevLabel, nextLabel }: { children: React.ReactNode; label: string; prevLabel: string; nextLabel: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });
  const btn = "flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-paper transition-colors hover:border-ink hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <div className="mb-6 hidden justify-end gap-2 md:flex">
        <button type="button" className={btn} onClick={() => go(-1)} disabled={edge.start} aria-label={prevLabel}><ChevronLeftIcon /></button>
        <button type="button" className={btn} onClick={() => go(1)} disabled={edge.end} aria-label={nextLabel}><ChevronRightIcon /></button>
      </div>
      <ul ref={track} aria-label={label} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {children}
      </ul>
    </div>
  );
}
