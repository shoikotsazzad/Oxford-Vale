import Link from "next/link";
import { site } from "@/data/site";
import { telLink, whatsappLink } from "@/lib/contact";
import { Container } from "./Container";
import { Year } from "./Year";

export function Footer() {
  const a = site.address;
  const socials = Object.entries(site.socials).filter(([, url]) => url);

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold">{site.name}</p>
          <p className="mt-3 text-sm text-muted">{site.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-semibold">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><a href={telLink()} className="hover:text-accent">{site.phoneDisplay}</a></li>
            <li><a href={whatsappLink()} className="hover:text-accent" target="_blank" rel="noopener">WhatsApp</a></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-accent">{site.email}</a></li>
            <li>{[a.street, a.area, a.city].filter(Boolean).join(", ")}</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Opening hours</p>
          <p className="mt-3 text-sm text-muted">{site.hoursText}</p>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener" className="capitalize text-muted hover:text-accent">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© <Year /> {site.name}. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-accent">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-accent">Terms</Link>
          </p>
        </Container>
      </div>
    </footer>
  );
}
