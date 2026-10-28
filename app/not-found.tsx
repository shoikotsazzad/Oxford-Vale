import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center py-24">
      <Container className="text-center">
        <p className="label text-muted">404</p>
        <h1 className="mt-3 font-serif text-4xl md:text-6xl">Page not found</h1>
        <p className="mt-4 text-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="label mt-8 inline-flex min-h-11 items-center rounded-md bg-ink px-6 text-white">
          Back to the shop
        </Link>
      </Container>
    </section>
  );
}
