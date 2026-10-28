"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { fmt } from "@/lib/i18n";
import { isLight } from "@/lib/colours";
import type { VariantDTO } from "@/lib/types";

type Props = {
  productId: string;
  price: number;
  salePrice: number | null;
  variants: VariantDTO[];
  sizeLabel: string;
  lowStockThreshold: number;
};

const MAX_QTY = 10;

export function PurchasePanel({ price, salePrice, variants, sizeLabel, lowStockThreshold }: Props) {
  const { t } = useI18n();
  const colours = useMemo(() => [...new Map(variants.map((v) => [v.colour, v.colourHex ?? "#999"])).entries()], [variants]);
  const [colour, setColour] = useState(colours[0]?.[0] ?? "");
  const sizes = variants.filter((v) => v.colour === colour);
  const oneSize = sizes.length === 1 && sizes[0].size === "One Size";
  const [size, setSize] = useState<string | null>(oneSize ? sizes[0].size : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { add } = useCart();

  const variant = sizes.find((v) => v.size === size) ?? null;
  const unitPrice = variant?.price ?? salePrice ?? price;
  const stock = variant?.stock ?? sizes.reduce((n, v) => n + v.stock, 0);
  const maxQty = Math.max(1, Math.min(MAX_QTY, variant?.stock ?? MAX_QTY));
  const allOut = sizes.every((v) => v.stock <= 0);

  const status = allOut || (variant && variant.stock <= 0)
    ? { text: t.product.outOfStock, cls: "text-danger" }
    : variant && variant.stock <= lowStockThreshold
      ? { text: fmt(t.product.lowStock, { n: variant.stock }), cls: "text-sale" }
      : { text: t.product.inStock, cls: "text-success" };

  function onAdd() {
    if (!variant) {
      setError(t.product.selectSize);
      return;
    }
    setError(null);
    start(async () => {
      const err = await add(variant.id, qty);
      if (err) setError(err.message);
      else setQty(1);
    });
  }

  return (
    <div>
      {/* A variant with its own price override shows that price instead of the product price. */}
      {variant && variant.price !== (salePrice ?? price) ? <Price price={variant.price} className="text-xl" /> : <Price price={price} salePrice={salePrice} className="text-xl" />}

      {colours.length > 1 && (
        <fieldset className="mt-6">
          <legend className="label">{t.product.colour}: <span className="text-muted normal-case tracking-normal">{colour}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {colours.map(([name, hex]) => (
              <button key={name} type="button" aria-pressed={name === colour} aria-label={name}
                onClick={() => { setColour(name); setSize(null); setQty(1); }}
                className={`h-10 w-10 rounded-full border ${name === colour ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""} ${isLight(hex) ? "border-ink/20" : "border-transparent"}`}
                style={{ background: hex }} />
            ))}
          </div>
        </fieldset>
      )}

      {!oneSize && (
        <fieldset className="mt-6">
          <div className="flex items-center justify-between">
            <legend className="label">{sizeLabel}{size && <span className="text-muted normal-case tracking-normal">: {size}</span>}</legend>
            <Link href="/size-guide" className="text-xs underline underline-offset-4">{t.product.sizeGuide}</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((v) => {
              const out = v.stock <= 0;
              return (
                <button key={v.id} type="button" disabled={out} aria-pressed={v.size === size}
                  onClick={() => { setSize(v.size); setQty(1); setError(null); }}
                  className={`min-h-11 min-w-12 rounded-md border px-3 text-sm transition-colors ${v.size === size ? "border-ink bg-ink text-white" : "border-line bg-white/60 hover:border-ink"} ${out ? "cursor-not-allowed text-muted line-through opacity-50 hover:border-line" : ""}`}>
                  {v.size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={`mt-5 text-sm ${status.cls}`} aria-live="polite">● {status.text}</p>

      <div className="mt-6 flex gap-3">
        <div className="flex items-center rounded-md border border-line bg-white/60" role="group" aria-label={t.product.quantity}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t.product.decrease} className="flex h-12 w-11 items-center justify-center disabled:opacity-30"><MinusIcon size={16} /></button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty || stock <= 0} aria-label={t.product.increase} className="flex h-12 w-11 items-center justify-center disabled:opacity-30"><PlusIcon size={16} /></button>
        </div>
        <Button className="min-h-12 flex-1" onClick={onAdd} disabled={pending || allOut || (variant !== null && variant.stock <= 0)}>
          {pending ? t.common.loading : t.product.addToCart}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
      {variant && <p className="mt-3 text-xs text-muted">{t.product.sku}: {variant.sku} · <Price price={unitPrice * qty} className="text-xs" /></p>}
    </div>
  );
}
