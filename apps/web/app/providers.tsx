"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

type Props = {
  messages: Record<string, unknown>;
  locale: string;
  timeZone?: string;
  children: ReactNode;
};

export function Providers({ messages, locale, timeZone, children }: Props) {
  return (
    <ClerkProvider>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={timeZone}
      >
        {children}
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}
