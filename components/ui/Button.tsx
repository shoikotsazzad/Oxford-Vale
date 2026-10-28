import Link from "next/link";
import { ArrowRightIcon } from "./icons";

type Variant = "primary" | "secondary" | "light" | "ghost";
const styles: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-charcoal",
  secondary: "border border-ink/80 text-ink hover:bg-ink hover:text-white",
  light: "bg-white text-ink hover:bg-paper",
  ghost: "border border-white/40 text-white hover:bg-white hover:text-ink",
};
const base =
  "label inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50";

type Common = { variant?: Variant; arrow?: boolean; className?: string; children: React.ReactNode };

export function ButtonLink({ href, variant = "primary", arrow, className = "", children, ...rest }: Common & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
      {arrow && <ArrowRightIcon size={16} />}
    </Link>
  );
}

export function Button({ variant = "primary", arrow, className = "", children, type = "button", ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
      {arrow && <ArrowRightIcon size={16} />}
    </button>
  );
}
