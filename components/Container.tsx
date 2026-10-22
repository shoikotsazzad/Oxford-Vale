export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <section className="border-b border-line bg-surface py-14 md:py-20">
      <Container>
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-muted">{intro}</p>}
      </Container>
    </section>
  );
}
