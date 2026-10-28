import { z } from "zod";
import { isValidLocation } from "@/lib/bd-geo";
import { nameSchema, phoneSchema } from "./common";

export const addressSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    division: z.string().trim().min(1, "Choose a division."),
    district: z.string().trim().min(1, "Choose a district."),
    upazila: z.string().trim().min(1, "Choose an upazila / area."),
    addressLine: z.string().trim().min(5, "Enter house, road and area.").max(200, "Address is too long."),
  })
  .refine((a) => isValidLocation(a.division, a.district, a.upazila), { message: "Choose a valid upazila for this district.", path: ["upazila"] });

export const savedAddressSchema = addressSchema.and(
  z.object({ label: z.string().trim().max(30).default("Home"), isDefault: z.coerce.boolean().default(false) }),
);

export type AddressInput = z.input<typeof addressSchema>;
