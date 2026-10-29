// Enum constants with no mongoose import, so client components can use them.
export const ROLES = ["customer", "staff", "manager", "owner"] as const;
export type Role = (typeof ROLES)[number];
export const ADMIN_ROLES: Role[] = ["staff", "manager", "owner"];

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
/** Stripe Checkout covers cards (Visa, Mastercard, Amex), Apple Pay, Google Pay and Klarna. */
export const PAYMENT_METHODS = ["stripe", "paypal"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const SIZE_TYPES = ["chest", "waist", "shoe-eu", "alpha", "hat", "one-size"] as const;
export type SizeType = (typeof SIZE_TYPES)[number];
