import "server-only";
import { refresh, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/services/catalog";
import { SETTINGS_TAG } from "@/server/services/settings";
import { ZONES_TAG } from "@/server/services/delivery";

// Called from admin server actions only (updateTag/refresh are Server Action APIs).
// updateTag expires immediately, so the storefront shows the change on the next request.
const TAGS = { catalog: CATALOG_TAG, settings: SETTINGS_TAG, zones: ZONES_TAG } as const;

export function revalidateStore(...areas: (keyof typeof TAGS)[]) {
  for (const a of areas) updateTag(TAGS[a]);
  refresh();
}
