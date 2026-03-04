import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-4 py-10">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
          Gorilla Build
        </p>
        <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-xl text-base text-white/75 sm:text-lg">
          {t("heroDescription")}
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href="/sign-up"
          className="rounded-md bg-lime-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-lime-300"
        >
          {t("startFree")}
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/admin"
          className="rounded-md border border-lime-300/40 px-5 py-3 text-sm font-semibold text-lime-300 transition hover:border-lime-300"
        >
          {t("admin")}
        </Link>
      </section>
    </main>
  );
}
