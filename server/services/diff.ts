// Field-level before/after for the audit log (pure, so services and tests can use it).
export type Changes = Record<string, { from: unknown; to: unknown }>;

/** Changed fields only, compared as JSON so ObjectIds, dates and arrays compare by value. */
export function diff(before: Record<string, unknown> | null, after: Record<string, unknown>, fields: string[]): Changes {
  const out: Changes = {};
  for (const f of fields) {
    const from = before?.[f];
    const to = after[f];
    if (JSON.stringify(from ?? null) !== JSON.stringify(to ?? null)) out[f] = { from: from ?? null, to: to ?? null };
  }
  return out;
}
