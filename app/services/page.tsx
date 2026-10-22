import Image from "next/image";
import { pages } from "@/data/pages";
import { services } from "@/data/services";
import { buildMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";

export const metadata = buildMetadata("services");

const taka = (n: number) => `৳${n.toLocaleString("en-IN")}`;

export default function ServicesPage() {
  const p = pages.services;
  return (
    <>
      <PageHeader title={p.heading} intro={p.intro} />
      <section className="py-16 md:py-24">
        <Container className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article key={s.slug} id={s.slug} className="overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative aspect-[4/3] bg-surface">
                <Image src={s.image} alt={s.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 text-muted">{s.summary}</p>
                {s.price !== null && <p className="mt-4 font-semibold text-accent">{taka(s.price)}</p>}
              </div>
            </article>
          ))}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
