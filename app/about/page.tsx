import Image from "next/image";
import { pages } from "@/data/pages";
import { buildMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";

export const metadata = buildMetadata("about");

export default function AboutPage() {
  const p = pages.about;
  return (
    <>
      <PageHeader title={p.heading} />
      <section className="py-16 md:py-24">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-4 text-lg leading-relaxed text-muted">
            {p.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface">
            <Image src={p.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
