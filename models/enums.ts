// Enum constants with no mongoose import, so client components can use them.
export const ROLES = ["customer", "staff", "manager", "owner"] as const;
export type Role = (typeof ROLES)[number];
export const ADMIN_ROLES: Role[] = ["staff", "manager", "owner"];

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_METHODS = ["cod", "sslcommerz", "bkash", "nagad"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const SIZE_TYPES = ["chest", "waist", "shoe-eu", "alpha", "hat", "one-size"] as const;
export type SizeType = (typeof SIZE_TYPES)[number];

/** A bKash/Nagad Trx ID is waiting for an admin, unless the order is paid or closed. */
export const isAwaitingVerification = (o: { status: OrderStatus; paymentStatus: PaymentStatus; payment?: { submittedAt?: Date | string | null } | null }) =>
  Boolean(o.payment?.submittedAt) && o.paymentStatus !== "paid" && !["cancelled", "returned", "refunded"].includes(o.status);
