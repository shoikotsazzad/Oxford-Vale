import "server-only";
import { getDictionary } from "@/lib/i18n";

/** UI labels (English). Async so callers stay unchanged if a language is ever added again. */
export const getT = async () => getDictionary();
