import "server-only";

import { headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  const locale = (await headers()).get("x-locale");
  return isLocale(locale) ? locale : defaultLocale;
}
