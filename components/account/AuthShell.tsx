import Link from "next/link";
import { Container } from "@/components/Container";

/** Narrow centred card for login / register / reset pages. */
export function AuthShell({ title, text, children, footer }: { title: string; text?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Container className="flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl md:text-5xl">{title}</h1>
        {text && <p className="mt-3 text-muted">{text}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-line pt-6 text-sm text-muted">{footer}</div>}
      </div>
    </Container>
  );
}

export const AuthLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-ink underline underline-offset-4">{children}</Link>
);
