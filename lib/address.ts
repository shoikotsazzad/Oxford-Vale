// Addresses: UK first (postcode validated and formatted), international supported for delivery outside the UK.

import { COUNTRY_NAMES } from "./countries";

/** ISO 3166-1 alpha-2 codes for the country picker (names in lib/countries.ts). */
const CODES =
  "AD AE AF AG AI AL AM AO AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

/** European countries for the "Europe" delivery option (EU, EEA, Switzerland, Balkans, microstates, Crown Dependencies). */
export const EUROPE =
  "AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SK SM UA VA XK".split(" ");

export const HOME_COUNTRY = "GB";
export const countryName = (code: string) => COUNTRY_NAMES[code] ?? code;
/** UK first, then A–Z. */
export const COUNTRIES = [HOME_COUNTRY, ...CODES.filter((c) => c !== HOME_COUNTRY).sort((a, b) => countryName(a).localeCompare(countryName(b)))].map((code) => ({ code, name: countryName(code) }));
export const isCountry = (code: string) => CODES.includes(code);

// UK postcode: outward code (area + district) + inward code (sector + unit). Covers GIR 0AA and BFPO-free civilian formats.
const UK_POSTCODE = /^(GIR ?0AA|[A-PR-UWYZ]([0-9]{1,2}|[A-HK-Y][0-9]{1,2}|[0-9][A-HJKPS-UW]|[A-HK-Y][0-9][ABEHMNPRV-Y]) ?[0-9][ABD-HJLNP-UW-Z]{2})$/;

/** "sw1a1aa" → "SW1A 1AA". Non-UK postcodes are only trimmed and upper-cased. */
export function formatPostcode(raw: string, country = HOME_COUNTRY) {
  const v = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (country !== HOME_COUNTRY) return v;
  const compact = v.replace(/\s/g, "");
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
}
export const isUkPostcode = (raw: string) => UK_POSTCODE.test(formatPostcode(raw));

export type PostalAddress = { line1: string; line2?: string; city: string; county?: string; postcode: string; country: string };

/** One line per part, for order pages, emails and invoices. */
export const addressLines = (a: PostalAddress) => [a.line1, a.line2, [a.city, a.county].filter(Boolean).join(", "), a.postcode, countryName(a.country)].filter((x): x is string => Boolean(x && x.trim()));
