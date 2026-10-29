import { z } from "zod";
import { formatPostcode, HOME_COUNTRY, isCountry, isUkPostcode } from "@/lib/address";
import { nameSchema, phoneSchema } from "./common";

export const addressSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    line1: z.string().trim().min(3, "Enter the first line of the address.").max(120, "Address line is too long."),
    line2: z.string().trim().max(120, "Address line is too long.").optional().default(""),
    city: z.string().trim().min(2, "Enter the town or city.").max(60, "Town or city is too long."),
    county: z.string().trim().max(60, "County is too long.").optional().default(""),
    postcode: z.string().trim().max(12, "Postcode is too long.").optional().default(""),
    country: z.string().trim().toUpperCase().refine(isCountry, "Choose a country.").default(HOME_COUNTRY),
  })
  .superRefine((a, ctx) => {
    if (a.country === HOME_COUNTRY && !isUkPostcode(a.postcode)) ctx.addIssue({ code: "custom", path: ["postcode"], message: "Enter a valid UK postcode, e.g. SW1A 1AA." });
  })
  .transform((a) => ({ ...a, postcode: formatPostcode(a.postcode, a.country) }));

export const savedAddressSchema = addressSchema.and(
  z.object({ label: z.string().trim().max(30).default("Home"), isDefault: z.coerce.boolean().default(false) }),
);

export type AddressInput = z.input<typeof addressSchema>;
