import { Button } from "./Button";
import { Container } from "./Container";

/** Closing call-to-action band shown before the footer on every page. */
export function CtaBand({
  heading = "Have a question? Talk to us today.",
  text = "Call or message us on WhatsApp — we usually reply quickly.",
}: { heading?: string; text?: string }) {
  return (
    <section className="py-16 md:py-20">
      <Container>
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-ink px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-12">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">{heading}</h2>
            <p className="mt-2 text-white/70">{text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="whatsapp">WhatsApp</Button>
            <Button href="call" variant="secondary">Call Now</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
