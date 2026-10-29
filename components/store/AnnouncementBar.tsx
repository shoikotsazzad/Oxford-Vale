import Link from "next/link";
import type { StoreSettings } from "@/lib/types";

export function AnnouncementBar({ bar }: { bar: StoreSettings["announcementBar"] }) {
  if (!bar.active || !bar.text) return null;
  const text = <span className="text-[11px] tracking-[0.18em] uppercase">{bar.text}</span>;
  return (
    <div className="bg-ink px-4 py-2 text-center text-paper">
      {bar.link ? <Link href={bar.link} className="hover:underline underline-offset-4">{text}</Link> : text}
    </div>
  );
}
