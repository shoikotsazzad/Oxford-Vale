import { telHref } from "./phone";

/** tel: link in international format ("020 7946 0001" → "tel:+442079460001"). */
export const telLink = telHref;
/** mailto: link with an optional pre-filled subject. */
export const mailtoLink = (email: string, subject?: string) => `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
