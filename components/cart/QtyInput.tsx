"use client";
import { useI18n } from "@/components/I18nProvider";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

export function QtyInput({ value, max, onChange, disabled, size = "md" }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean; size?: "sm" | "md" }) {
  const { t } = useI18n();
  const h = size === "sm" ? "h-9 w-9" : "h-12 w-11";
  return (
    <div className={`inline-flex items-center rounded-md border border-line bg-surface/60 ${disabled ? "opacity-60" : ""}`} role="group" aria-label={t.product.quantity}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label={t.product.decrease} className={`flex ${h} items-center justify-center disabled:opacity-30`}>
        <MinusIcon size={14} />
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label={t.product.increase} className={`flex ${h} items-center justify-center disabled:opacity-30`}>
        <PlusIcon size={14} />
      </button>
    </div>
  );
}
