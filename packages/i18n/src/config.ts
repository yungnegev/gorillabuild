export const locales = ["ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export function isLocale(value: string | null | undefined): value is Locale {
  if (value == null) return false;
  return locales.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;

  const normalized = value.toLowerCase().split("-")[0];
  return isLocale(normalized) ? normalized : null;
}

export function detectLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferredLocales = acceptLanguage
    .toLowerCase()
    .split(",")
    .map((part) => part.trim().split(";")[0]);

  for (const preferredLocale of preferredLocales) {
    const normalized = normalizeLocale(preferredLocale);
    if (normalized) return normalized;
  }

  return defaultLocale;
}
