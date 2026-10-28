// BDT formatting. All amounts are whole taka integers. Uses South Asian grouping (1,23,456).
const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatBDT = (amount: number) => `৳${fmt.format(Math.round(amount))}`;
/** Plain number for inputs/CSV, no symbol. */
export const formatNumber = (n: number) => fmt.format(n);
