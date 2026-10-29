// Shared admin building blocks (server-safe: no hooks).
import Link from "next/link";
import type { OrderStatus, PaymentStatus } from "@/models/enums";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

export const dateTime = (d: string | Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(d));
export const dateOnly = (d: string | Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(new Date(d));
export function ago(d: string | Date, now = Date.now()) {
  const m = Math.round((now - new Date(d).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "", pad = true }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`min-w-0 rounded-lg border border-line bg-surface ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export type Tone = "ok" | "warn" | "bad" | "info" | "neutral";
const TONE: Record<Tone, string> = {
  ok: "bg-success/10 text-success",
  warn: "bg-warn/10 text-warn",
  bad: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-sand text-ink",
};
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`}>{children}</span>;
}

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "warn", confirmed: "info", processing: "info", shipped: "info", delivered: "ok", cancelled: "bad", returned: "bad", refunded: "neutral",
};
export const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{label(status)}</Badge>;
}
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone: Tone = status === "paid" ? "ok" : status === "failed" ? "bad" : "neutral";
  return <Badge tone={tone}>{label(status)}</Badge>;
}

export function StatCard({ label: title, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="label text-muted">{title}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </>
  );
  const cls = "block rounded-lg border border-line bg-surface p-5";
  return href ? <Link href={href} className={`${cls} transition-colors hover:border-ink`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Table shell: horizontal scroll on small screens, consistent cell styles via the `th`/`td` classes below. */
export function Table({ children, minWidth = "48rem" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full text-left text-sm" style={{ minWidth }}>{children}</table>
    </div>
  );
}
export const th = "border-b border-line bg-paper/60 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted";
export const td = "border-b border-line px-4 py-3 align-top";

export function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-muted">{text}</td>
    </tr>
  );
}

/** Prev / next with "page x of y"; keeps the current filters. */
export function AdminPagination({ page, pages, total, href }: { page: number; pages: number; total: number; href: (page: number) => string }) {
  if (pages <= 1) return <p className="mt-4 text-sm text-muted">{total} result{total === 1 ? "" : "s"}</p>;
  const cell = "inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-line bg-surface px-3";
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">{total} results · page {page} of {pages}</p>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={`${cell} hover:border-ink`} aria-label="Previous page"><ChevronLeftIcon size={16} /></Link> : <span className={`${cell} opacity-40`}><ChevronLeftIcon size={16} /></span>}
        {page < pages ? <Link href={href(page + 1)} className={`${cell} hover:border-ink`} aria-label="Next page"><ChevronRightIcon size={16} /></Link> : <span className={`${cell} opacity-40`}><ChevronRightIcon size={16} /></span>}
      </div>
    </nav>
  );
}

/** Build a list URL from current filters plus overrides (empty values are dropped). */
export function listHref(path: string, params: Record<string, string | undefined>, over: Record<string, string | number | undefined> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...over })) if (v !== undefined && v !== "" && !(k === "page" && String(v) === "1")) p.set(k, String(v));
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

/** GET filter form: plain HTML, so filters are shareable URLs and work without JavaScript. */
export function FilterBar({ action, children }: { action: string; children: React.ReactNode }) {
  return (
    <form action={action} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
      {children}
      <button type="submit" className="label h-10 rounded-md bg-ink px-4 text-paper hover:bg-charcoal">Apply</button>
      <Link href={action} className="label inline-flex h-10 items-center rounded-md px-3 text-muted hover:text-ink">Reset</Link>
    </form>
  );
}
export const filterInput = "mt-1 block h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-ink";
export function Filter({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-muted">
      {text}
      {children}
    </label>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="h-9 w-48 animate-pulse rounded bg-sand" />
      <div className="h-16 animate-pulse rounded-lg bg-sand/70" />
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 animate-pulse rounded bg-sand/50" />)}
    </div>
  );
}

/** Shown in place of the edit controls for roles that can only view. */
export function ReadOnlyNote() {
  return <p className="mb-4 rounded-md border border-line bg-sand/60 px-4 py-3 text-sm">View only: your role can&apos;t change this section.</p>;
}

/** Paging + total for list pages. */
export function pageOf(raw: string | undefined, total: number, perPage: number) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pages, Math.max(1, Number.parseInt(raw ?? "1", 10) || 1));
  return { page, pages, skip: (page - 1) * perPage };
}

export const pageNum = (raw: string | undefined) => Math.max(1, Math.min(10_000, Number.parseInt(raw ?? "1", 10) || 1));

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
