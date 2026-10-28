"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/Button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="py-24 text-center">
      <p className="label text-muted">Error</p>
      <h1 className="mt-3 font-serif text-4xl">Something went wrong</h1>
      <p className="mt-3 text-muted">Please try again. If it keeps happening, contact us and we&apos;ll help.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="label inline-flex min-h-11 items-center rounded-md border border-ink px-5">Home</Link>
      </div>
    </Container>
  );
}
