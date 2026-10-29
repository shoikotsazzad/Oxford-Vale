"use client";
import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { CheckIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import type { PublicOffer } from "@/server/services/coupon";
import { BrandImage } from "./BrandImage";

/** Phone/tablet promo card for an active coupon. Tapping the code copies it for checkout. */
export function OfferCard({ offer, image }: { offer: PublicOffer; image: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <section className="py-3 lg:hidden">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-charcoal text-white ring-1 ring-white/10">
          <div className="absolute inset-y-0 right-0 w-[48%]">
            <BrandImage src={image} alt="" fill sizes="48vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/40 to-transparent" />
          </div>
          <div className="relative flex min-h-44 max-w-[66%] flex-col justify-center gap-1 px-5 py-6 sm:min-h-52 sm:px-8">
            <p className="font-serif text-3xl leading-none sm:text-4xl">
              {offer.headline} <span className="text-2xl sm:text-3xl">{t.home.offerOff}</span>
            </p>
            {offer.text && <p className="text-sm text-white/75">{offer.text}</p>}
            <button
              type="button"
              onClick={copy}
              title={t.home.offerCopy}
              className="mt-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-full whitespace-nowrap bg-white px-4 text-sm text-night transition-colors hover:bg-white/90"
            >
              {copied ? (
                <><CheckIcon size={16} /> {t.home.offerCopied}</>
              ) : (
                <>{t.home.offerUse}: <span className="font-semibold tracking-wider">{offer.code}</span></>
              )}
            </button>
            <span className="sr-only" aria-live="polite">{copied ? t.home.offerCopied : ""}</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
