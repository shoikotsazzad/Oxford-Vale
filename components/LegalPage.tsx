import { Container, PageHeader } from "./Container";

export function LegalPage({ title, sections }: { title: string; sections: { heading: string; body: string }[] }) {
  return (
    <>
      <PageHeader title={title} />
      <section className="py-16">
        <Container className="max-w-3xl space-y-8">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
