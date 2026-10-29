// Phone numbers: UK mobiles and landlines (07…, 01…, 02…, 03…, 08…), or any international number in +country format.
// Stored normalised: UK as 0XXXXXXXXXX, others as +XXXXXXXXXXX.

/** "+44 (0)20 7946 0001" → "02079460001"; "+1 212 555 0100" → "+12125550100". */
export function normalizePhone(raw: string) {
  const v = raw.trim().replace(/[\s().-]/g, "");
  if (/^(\+|00)44/.test(v)) return "0" + v.replace(/^(\+|00)44/, "").replace(/^0/, "");
  if (v.startsWith("00")) return "+" + v.slice(2);
  return v;
}

const UK = /^0(7\d{9}|[123]\d{9}|8\d{8,9})$/;
const INTL = /^\+[1-9]\d{6,14}$/;
export const isValidPhone = (normalised: string) => UK.test(normalised) || INTL.test(normalised);

/** Display in UK groupings: "020 7946 0001", "07700 900123", "0800 000 0001", "0161 496 0000", "01632 960000". */
export function formatPhone(phone: string) {
  const v = normalizePhone(phone);
  if (!UK.test(v)) return v;
  const g = (...sizes: number[]) => sizes.map((n, i) => v.slice(sizes.slice(0, i).reduce((a, b) => a + b, 0), sizes.slice(0, i).reduce((a, b) => a + b, 0) + n)).join(" ");
  if (/^02/.test(v)) return g(3, 4, 4);
  if (/^07/.test(v)) return g(5, 6);
  if (/^0[38]/.test(v)) return v.length === 11 ? g(4, 3, 4) : g(4, 3, 3);
  if (/^01(1\d|\d1)/.test(v)) return g(4, 3, 4);
  return g(5, 6);
}

/** tel: link in international format. */
export const telHref = (phone: string) => {
  const v = normalizePhone(phone);
  return `tel:${v.startsWith("0") ? "+44" + v.slice(1) : v}`;
};
