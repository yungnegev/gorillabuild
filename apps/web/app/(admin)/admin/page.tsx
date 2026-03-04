import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
  const t = await getTranslations("admin");

  return (
    <section className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-5">
      <h2 className="text-2xl font-bold">{t("placeholderTitle")}</h2>
      <p className="text-white/75">
        {t("placeholderDescription")}
      </p>
    </section>
  );
}
