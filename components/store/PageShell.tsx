import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Section } from "@/data/pages";

/** Title block for static pages. */
export function PageShell({ title, intro, homeLabel, children }: { title: string; intro?: string; homeLabel: string; children: React.ReactNode }) {
  return (
    <Container className="py-8 md:py-12">
      <Breadcrumbs items={[{ label: homeLabel, href: "/" }, { label: title }]} />
      <header className="mt-4 max-w-3xl border-b border-line pb-8 md:pb-10">
        <h1 className="font-serif text-4xl md:text-6xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
      </header>
      <div className="mt-10">{children}</div>
    </Container>
  );
}

export function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="max-w-3xl space-y-10">
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="font-serif text-2xl">{s.heading}</h2>
          {s.body.map((p, i) => <p key={i} className="mt-3 leading-relaxed text-ink/80">{p}</p>)}
        </section>
      ))}
    </div>
  );
}
