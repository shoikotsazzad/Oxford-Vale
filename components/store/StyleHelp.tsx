import type { Dict } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";

/** Dark closing band: sizing help over WhatsApp, plus the size guide. */
export function StyleHelp({ whatsapp, t }: { whatsapp: string; t: Dict }) {
  return (
    <section className="reveal py-12 md:py-16">
      <Container>
        <div className="grid gap-8 rounded-2xl bg-night px-6 py-12 text-white md:grid-cols-[1.4fr_1fr] md:items-end md:px-12 md:py-16 lg:px-16">
          <div>
            <p className="label text-white/60">{t.home.helpEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl uppercase md:text-5xl">{t.home.helpTitle}</h2>
            <p className="mt-4 max-w-lg text-white/75">{t.home.helpText}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href={whatsappLink(whatsapp, "Hello Oxford Vale, I need help choosing my size.")}
              target="_blank"
              rel="noopener noreferrer"
              className="label inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-ink transition-colors hover:bg-paper"
            >
              <WhatsAppIcon size={18} /> {t.home.helpCta}
            </a>
            <ButtonLink href="/size-guide" variant="ghost">{t.home.sizeGuide}</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
