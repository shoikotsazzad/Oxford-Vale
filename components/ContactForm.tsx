"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/contact";
import type { FieldErrors } from "@/lib/validate";

type State = { status: "idle" | "sending" | "done" | "error"; errors: FieldErrors; message?: string; waUrl?: string };

/**
 * Validates on the server (/api/contact). The API saves the lead when MongoDB is enabled.
 * On success it opens WhatsApp with the message prefilled so the business sees it instantly.
 */
export function ContactForm() {
  const page = usePathname();
  const [state, setState] = useState<State>({ status: "idle", errors: {} });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState({ status: "sending", errors: {} });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, page }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", errors: json.errors ?? {}, message: json.error });
        return;
      }
      const text = `Hi, I'm ${data.name} (${data.phone}).\n${data.message}`;
      const waUrl = whatsappLink(text);
      window.open(waUrl, "_blank", "noopener"); // may be blocked; link below is the fallback
      form.reset();
      setState({ status: "done", errors: {}, waUrl });
    } catch {
      setState({ status: "error", errors: {}, message: "Network error. Please try WhatsApp or call us." });
    }
  }

  const field = "mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
  const err = (k: keyof FieldErrors) =>
    state.errors[k] && <p className="mt-1 text-sm text-red-600">{state.errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input id="name" name="name" required autoComplete="name" className={field} />
        {err("name")}
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-medium">Mobile number</label>
        <input id="phone" name="phone" type="tel" required inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" className={field} />
        {err("phone")}
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium">Email <span className="text-muted">(optional)</span></label>
        <input id="email" name="email" type="email" autoComplete="email" className={field} />
        {err("email")}
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <textarea id="message" name="message" rows={4} required className={field} />
        {err("message")}
      </div>

      <button
        type="submit"
        disabled={state.status === "sending"}
        className="min-h-11 w-full rounded-full bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
      >
        {state.status === "sending" ? "Sending…" : "Send message"}
      </button>

      <p aria-live="polite" className="text-sm">
        {state.status === "done" && (
          <span className="text-green-700">
            Thank you! We&apos;ll get back to you soon.{" "}
            <a href={state.waUrl} target="_blank" rel="noopener" className="font-semibold underline">Continue on WhatsApp</a>
          </span>
        )}
        {state.status === "error" && state.message && <span className="text-red-600">{state.message}</span>}
      </p>
    </form>
  );
}
