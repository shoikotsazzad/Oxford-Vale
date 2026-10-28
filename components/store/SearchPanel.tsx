"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { SearchIcon, CloseIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { imageSrc } from "@/lib/images";

type Suggestion = { slug: string; name: string; category: string; price: number; salePrice: number | null; image: string | null };

/** Search box with live suggestions (debounced, keyboard navigable). */
export function SearchPanel({ onClose, autoFocus = true }: { onClose?: () => void; autoFocus?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const term = q.trim();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        if (json.ok) {
          setItems(json.data);
          setActive(-1);
        }
      } catch {
        /* aborted or offline: keep previous suggestions */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);

  const visible = term.length >= 2 ? items : [];

  function go(href: string) {
    onClose?.();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      onClose?.();
    }
  }

  return (
    <div className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && visible[active]) go(`/product/${visible[active].slug}`);
          else if (term) go(`/search?q=${encodeURIComponent(term)}`);
        }}
        className="flex items-center gap-3 border-b border-ink pb-2"
      >
        <SearchIcon size={20} className="shrink-0 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t.header.searchPlaceholder}
          aria-label={t.nav.search}
          role="combobox"
          aria-expanded={visible.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="min-h-11 w-full bg-transparent text-lg outline-none placeholder:text-muted"
        />
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t.nav.close} className="flex h-11 w-11 shrink-0 items-center justify-center">
            <CloseIcon />
          </button>
        )}
      </form>

      {term.length >= 2 && (
        <div className="mt-3">
          <ul id={listId} role="listbox" className="divide-y divide-line">
            {visible.map((s, i) => (
              <li key={s.slug} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                <Link
                  href={`/product/${s.slug}`}
                  onClick={() => onClose?.()}
                  className={`flex items-center gap-4 py-2.5 ${active === i ? "bg-sand" : "hover:bg-sand/60"}`}
                >
                  <span className="relative h-16 w-13 shrink-0 overflow-hidden rounded bg-sand">
                    <Image src={imageSrc(s.image)} alt="" fill sizes="52px" className="object-cover" unoptimized={!s.image} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{s.name}</span>
                    <span className="block text-xs text-muted">{s.category}</span>
                  </span>
                  <Price price={s.price} salePrice={s.salePrice} className="text-sm" />
                </Link>
              </li>
            ))}
          </ul>
          {!loading && visible.length === 0 && <p className="py-4 text-sm text-muted">{t.header.noSuggestions} “{term}”.</p>}
          {visible.length > 0 && (
            <Link href={`/search?q=${encodeURIComponent(term)}`} onClick={() => onClose?.()} className="label mt-3 inline-block underline-offset-4 hover:underline">
              {t.header.searchAll} “{term}”
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
