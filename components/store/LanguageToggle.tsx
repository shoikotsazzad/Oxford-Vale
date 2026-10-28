"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/server/actions/lang";
import { useI18n } from "@/components/I18nProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLanguage(lang === "en" ? "bn" : "en");
          router.refresh();
        })
      }
      lang={lang === "en" ? "bn" : "en"}
      className={`min-h-11 text-xs tracking-wide disabled:opacity-50 ${className}`}
    >
      {t.header.language}
    </button>
  );
}
