"use client";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/components/I18nProvider";
import { SearchIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { OPEN_SEARCH_EVENT } from "./HeaderClient";

const noop = () => () => {};
// The shopper's own clock decides the greeting, so it is only known in the browser.
const partOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
};

/** Phone/tablet home intro: a greeting and a search pill that opens the header search. */
export function MobileWelcome({ firstName }: { firstName?: string }) {
  const { t } = useI18n();
  const part = useSyncExternalStore(noop, partOfDay, () => null);
  return (
    <section className="pt-5 pb-3 lg:hidden">
      <Container>
        <p className="min-h-7 font-serif text-xl sm:text-2xl">
          {part ? `${t.home.greeting[part]}${firstName ? `, ${firstName}` : ""}` : t.home.welcome}
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
          className="mt-3 flex h-12 w-full items-center gap-3 rounded-full border border-line bg-surface px-5 text-left text-sm text-muted shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors hover:border-ink/30"
        >
          <SearchIcon size={18} className="text-ink" />
          {t.header.searchPlaceholder}
        </button>
      </Container>
    </section>
  );
}
