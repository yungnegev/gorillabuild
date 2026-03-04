import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gorilla Build",
  description: "Fitness app",
  icons: { icon: "/favicon.ico" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
