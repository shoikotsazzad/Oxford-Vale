// Role → permission map for the admin panel (notes/plan.md §4 RBAC).
import type { Role } from "@/models/shared";

export type Permission =
  | "dashboard" // dashboard, orders, customers & leads, messages
  | "orders"
  | "customers"
  | "messages"
  | "catalog.view" // products, categories, collections, coupons, delivery zones
  | "catalog.edit"
  | "settings" // owner only
  | "users"
  | "audit";

const STAFF: Permission[] = ["dashboard", "orders", "customers", "messages", "catalog.view"];
const MANAGER: Permission[] = [...STAFF, "catalog.edit"];
const OWNER: Permission[] = [...MANAGER, "settings", "users", "audit"];

const MAP: Record<Role, Permission[]> = { customer: [], staff: STAFF, manager: MANAGER, owner: OWNER };

export const can = (role: Role, perm: Permission) => MAP[role].includes(perm);

export const ROLE_LABEL: Record<Role, string> = { customer: "Customer", staff: "Staff", manager: "Manager", owner: "Owner" };
