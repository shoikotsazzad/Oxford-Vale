// UK store setup shared by the seed and the migration (npm run migrate:uk).
import { EUROPE, HOME_COUNTRY } from "@/lib/address";

/** Delivery options. Fees in cents; UK Next day from the brief (£6.95 ≈ $8.95), the rest are placeholders (notes/missing.md). */
export const DELIVERY_OPTIONS = [
  { name: "UK Standard", fee: 595, etaMinDays: 3, etaMaxDays: 5, countries: [HOME_COUNTRY], freeEligible: true, note: "", sortOrder: 1 },
  { name: "UK Next day", fee: 895, etaMinDays: 1, etaMaxDays: 1, countries: [HOME_COUNTRY], freeEligible: false, note: "Order before 2 pm, Monday to Friday", sortOrder: 2 },
  { name: "Europe", fee: 1995, etaMinDays: 4, etaMaxDays: 8, countries: EUROPE, freeEligible: false, note: "Import duties may apply", sortOrder: 3 },
  { name: "Rest of the world", fee: 3495, etaMinDays: 7, etaMaxDays: 14, countries: [], freeEligible: false, note: "Import duties may apply", sortOrder: 4 },
];

/** Demo coupons (cents for money). */
export const COUPONS = [
  { code: "WELCOME10", description: "10% off your first order over $100", type: "percent", value: 10, minOrder: 10000, expiresAt: new Date("2027-12-31T23:59:59Z"), usageLimit: 0, perCustomerLimit: 1 },
  { code: "SAVE25", description: "$25 off orders over $200", type: "fixed", value: 2500, minOrder: 20000, expiresAt: new Date("2027-12-31T23:59:59Z"), usageLimit: 200, perCustomerLimit: 0 },
];

