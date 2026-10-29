// The store runs on UK time (GMT in winter, BST in summer). Order numbers, "today" on the dashboard and every
// displayed date use it, whatever time zone the server runs in.
export const TIME_ZONE = "Europe/London";

const partsFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" });

/** Calendar date and time in London. */
export function londonDateParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), min: Number(p.minute), s: Number(p.second) };
}

/** London's offset from UTC at that moment, in ms (0 in winter, +1h in summer). */
function offsetMs(d: Date) {
  const p = londonDateParts(d);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(d.getTime() / 1000) * 1000;
}

/** Start of the London calendar day containing `d`, as a UTC Date. */
export function londonDayStart(d: Date) {
  const { y, m, d: day } = londonDateParts(d);
  const midnightUtc = Date.UTC(y, m - 1, day);
  return new Date(midnightUtc - offsetMs(new Date(midnightUtc)));
}

/** "2026-10-28" in London. */
export const londonDateKey = (d: Date) => {
  const { y, m, d: day } = londonDateParts(d);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

/** A "2026-10-22T18:00" (datetime-local) value read as London time, whatever the server's time zone. */
export function londonLocalToDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return new Date(s);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return new Date(guess - offsetMs(new Date(guess)));
}

/** Date → "2026-10-22T18:00" in London, for datetime-local inputs. */
export function toLondonLocal(d: Date) {
  const p = londonDateParts(d);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${two(p.m)}-${two(p.d)}T${two(p.h)}:${two(p.min)}`;
}
