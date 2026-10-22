import Link from "next/link";
import { ctaHref, isExternal } from "@/lib/contact";

type Props = { href: string; children: React.ReactNode; variant?: "primary" | "secondary"; className?: string };

const styles = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-line bg-white text-ink hover:border-ink",
};

/** CTA button. href accepts a route, a URL, "whatsapp" or "call". */
export function Button({ href, children, variant = "primary", className = "" }: Props) {
  const url = ctaHref(href);
  const cls = `inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${styles[variant]} ${className}`;
  return isExternal(url) ? (
    <a href={url} className={cls} target={url.startsWith("http") ? "_blank" : undefined} rel="noopener">
      {children}
    </a>
  ) : (
    <Link href={url} className={cls}>
      {children}
    </Link>
  );
}
