import Image from "next/image";
import Link from "next/link";
import { pages } from "@/data/pages";
import { services } from "@/data/services";
import { gallery } from "@/data/gallery";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";

export const metadata = buildMetadata("home");

export default function HomePage() {
  const { hero } = pages.home;

  return (
    <>
      <section className="py-14 md:py-24">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">{hero.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.05]">{hero.heading}</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{hero.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
              <Button href={hero.secondaryCta.href} variant="secondary">{hero.secondaryCta.label}</Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface">
            <Image src={hero.image} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        </Container>
      </section>

      <section className="bg-surface py-16 md:py-24">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">{pages.services.heading}</h2>
            <Link href="/services" className="text-sm font-semibold text-accent hover:underline">View all →</Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 3).map((s) => (
              <article key={s.slug} className="rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.summary}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">{pages.gallery.heading}</h2>
            <Link href="/gallery" className="text-sm font-semibold text-accent hover:underline">See more →</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.slice(0, 4).map((g, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
                <Image src={g.src} alt={g.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
