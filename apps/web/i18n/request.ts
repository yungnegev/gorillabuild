import {
  defaultLocale,
  detectLocaleFromAcceptLanguage,
  getMessages,
  isLocale,
  type Locale,
} from "@gorillabuild/i18n";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale;

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

    if (cookieLocale && isLocale(cookieLocale)) {
      locale = cookieLocale;
    } else {
      const headerStore = await headers();
      locale = detectLocaleFromAcceptLanguage(
        headerStore.get("accept-language"),
      );
    }
  } catch {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: getMessages(locale),
    timeZone: "UTC",
  };
});
