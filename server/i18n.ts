import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getDictionary, isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";

/** Current UI language from the cookie (English by default). Call inside a Suspense boundary. */
export const getLang = cache(async (): Promise<Lang> => {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "en";
});

export const getT = async () => getDictionary(await getLang());
