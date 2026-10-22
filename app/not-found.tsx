import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <section className="py-24">
      <Container className="text-center">
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Page not found</h1>
        <p className="mt-4 text-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/">Go home</Button>
          <Button href="/contact" variant="secondary">Contact us</Button>
        </div>
      </Container>
    </section>
  );
}
