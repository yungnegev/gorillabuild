import en from "./locales/en.json";
import ru from "./locales/ru.json";
import type { Locale } from "./config";

export const messagesByLocale = {
  ru,
  en,
} as const;

export type Messages = typeof ru;

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] as Messages;
}
