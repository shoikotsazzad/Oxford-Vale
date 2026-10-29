"use client";
import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { THEME_KEY, type Theme } from "@/lib/theme";

// The current theme lives on <html data-theme>, set by the head script; this watches it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // With no saved choice, follow the system setting live.
  const media = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (!readSaved()) document.documentElement.dataset.theme = media.matches ? "dark" : "light";
  };
  media.addEventListener("change", onSystem);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onSystem);
  };
}
const readSaved = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};
const current = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light") as Theme;

/** Sun/moon button: switches the whole site between light and dark and remembers the choice. */
export function ThemeToggle({ className = "", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, current, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;
  return (
    <button
      type="button"
      aria-label={withLabel ? undefined : label}
      title={label}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {}
      }}
      className={className}
    >
      {/* Before hydration the theme is unknown: show the moon, which is right for the light default. */}
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      {withLabel && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
