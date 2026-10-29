// Money is stored as whole cents (USD): $235.00 is 23500. Integer cents keep totals, coupons and refunds exact.
export const CURRENCY = "USD";
const withCents = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
const whole = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });

/** 23500 → "$235", 895 → "$8.95". */
export const formatMoney = (cents: number) => {
  const c = Math.round(cents);
  return c % 100 === 0 ? whole.format(c / 100) : withCents.format(c / 100);
};
/** Always two decimals: invoices and totals ("$235.00"). */
export const formatMoneyExact = (cents: number) => withCents.format(Math.round(cents) / 100);
/** Dollars typed in a form ("235", "8.95") → cents. */
export const toCents = (dollars: number | string) => Math.round(Number(dollars) * 100);
/** Cents → plain dollars for inputs and CSV ("8.95", "235"). */
export const toDollars = (cents: number) => (Math.round(cents) % 100 === 0 ? String(Math.round(cents) / 100) : (Math.round(cents) / 100).toFixed(2));
/** Plain number with thousands separators (counts, not money). */
export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
