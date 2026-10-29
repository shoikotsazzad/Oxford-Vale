"use client";
import { useState } from "react";
import { formatMoney } from "@/lib/money";

type Point = { date: string; revenue: number; orders: number };

const day = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** Round the axis top up to a "nice" number so gridline labels read cleanly. */
function niceMax(v: number) {
  if (v <= 0) return 100_000; // cents
  const mag = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((m) => m >= v)!;
}
/** Axis labels from cents: $1.2k, $850. */
const compact = (cents: number) => {
  const d = cents / 100;
  return d >= 1000 ? `$${(d / 1000).toFixed(d % 1000 ? 1 : 0)}k` : `$${Math.round(d)}`;
};

/** Daily sales, one bar per day. Single series: one ink colour, no legend; hover/focus shows the exact numbers. */
export function SalesChart({ data }: { data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const ticks = [max, max / 2, 0];
  const point = active === null ? null : data[active];

  return (
    <figure>
      <div className="relative h-56 pl-12">
        {/* Recessive grid + y labels */}
        {ticks.map((t) => (
          <div key={t} className="absolute right-0 left-12 border-t border-line" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -top-2.5 -left-12 w-10 text-right text-[11px] text-muted tabular-nums">{compact(t)}</span>
          </div>
        ))}
        <div className="relative flex h-full items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
          {data.map((d, i) => (
            <button
              key={d.date}
              type="button"
              className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${day(d.date, { day: "numeric", month: "short" })}: ${formatMoney(d.revenue)} from ${d.orders} order${d.orders === 1 ? "" : "s"}`}
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${active === i ? "bg-ink" : "bg-ink/75"} group-focus-visible:ring-2 group-focus-visible:ring-ink group-focus-visible:ring-offset-2`}
                style={{ height: d.revenue ? `max(${(d.revenue / max) * 100}%, 3px)` : "0" }}
              />
            </button>
          ))}
        </div>
        {point && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md bg-charcoal px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
            style={{ left: `calc(3rem + (100% - 3rem) * ${(active + 0.5) / data.length})` }}
          >
            <p className="text-white/60">{day(point.date, { weekday: "short", day: "numeric", month: "short" })}</p>
            <p className="mt-0.5 font-medium tabular-nums">{formatMoney(point.revenue)}</p>
            <p className="text-white/60">{point.orders} order{point.orders === 1 ? "" : "s"}</p>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between pl-12 text-[11px] text-muted" aria-hidden="true">
        {data.filter((_, i) => i % 7 === 0 || i === data.length - 1).map((d) => (
          <span key={d.date}>{day(d.date, { day: "numeric", month: "short" })}</span>
        ))}
      </div>
      <figcaption className="sr-only">Daily sales for the last {data.length} days</figcaption>
      <table className="sr-only">
        <thead><tr><th>Date</th><th>Sales</th><th>Orders</th></tr></thead>
        <tbody>
          {data.map((d) => <tr key={d.date}><td>{d.date}</td><td>{formatMoney(d.revenue)}</td><td>{d.orders}</td></tr>)}
        </tbody>
      </table>
    </figure>
  );
}
