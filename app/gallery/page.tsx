import Image from "next/image";
import { pages } from "@/data/pages";
import { gallery } from "@/data/gallery";
import { buildMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";

export const metadata = buildMetadata("gallery");

export default function GalleryPage() {
  return (
    <>
      <PageHeader title={pages.gallery.heading} />
      <section className="py-16 md:py-24">
        <Container className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {gallery.map((g, i) => (
            <figure key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
              <Image src={g.src} alt={g.alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition duration-300 hover:scale-105" />
            </figure>
          ))}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
