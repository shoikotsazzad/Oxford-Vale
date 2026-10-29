import { formatMoney } from "@/lib/money";

export function Price({ price, salePrice, className = "" }: { price: number; salePrice?: number | null; className?: string }) {
  if (salePrice != null && salePrice < price) {
    return (
      <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
        <span className="text-sale">{formatMoney(salePrice)}</span>
        <s className="text-sm text-muted">{formatMoney(price)}</s>
      </span>
    );
  }
  return <span className={className}>{formatMoney(price)}</span>;
}
