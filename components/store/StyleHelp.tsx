import type { Dict } from "@/lib/i18n";
import { mailtoLink, telLink } from "@/lib/contact";
import { ButtonLink } from "@/components/ui/Button";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";

/** Dark closing band: sizing help by phone or email, plus the size guide. */
export function StyleHelp({ phone, email, t }: { phone: string; email: string; t: Dict }) {
  const btn = "label inline-flex min-h-11 items-center gap-2 rounded-md px-5 transition-colors";
  return (
    <section className="reveal py-7 md:py-10 lg:py-16">
      <Container>
        <div className="grid gap-8 rounded-3xl bg-night px-6 py-10 text-white lg:rounded-2xl md:grid-cols-[1.4fr_1fr] md:items-end md:px-12 md:py-16 lg:px-16">
          <div>
            <p className="label text-white/60">{t.home.helpEyebrow}</p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl lg:uppercase">{t.home.helpTitle}</h2>
            <p className="mt-4 max-w-lg text-white/75">{t.home.helpText}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a href={telLink(phone)} className={`${btn} bg-white text-night hover:bg-white/90`}>
              <PhoneIcon size={18} /> {t.home.helpCall} {phone}
            </a>
            <a href={mailtoLink(email, "Help with sizing")} className={`${btn} border border-white/40 text-white hover:bg-white hover:text-night`}>
              <MailIcon size={18} /> {t.home.helpEmail}
            </a>
            <ButtonLink href="/size-guide" variant="ghost">{t.home.sizeGuide}</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
