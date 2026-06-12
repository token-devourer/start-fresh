import { getTranslations } from "next-intl/server";

export default async function RulesPage() {
  const t = await getTranslations("rules");

  return (
    <main className="app-shell py-8">
      <article className="panel mx-auto max-w-3xl space-y-6 p-5 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="display text-sm font-black uppercase tracking-[0.18em] text-[var(--gold)]">{t("tagline")}</p>
            <h1 className="display mt-2 text-3xl font-black">{t("title")}</h1>
          </div>
          <a className="button secondary !min-h-9 !px-4 text-sm" href="/">
            ← {t("back")}
          </a>
        </div>

        <section className="space-y-2">
          <h2 className="display text-xl font-bold">{t("goalTitle")}</h2>
          <p className="text-[var(--muted)]">{t("goalBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="display text-xl font-bold">{t("turnsTitle")}</h2>
          <p className="text-[var(--muted)]">{t("turnsBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="display text-xl font-bold">{t("actionsTitle")}</h2>
          <ul className="list-disc space-y-2 pl-5 text-[var(--muted)]">
            <li>{t("actionSkip")}</li>
            <li>{t("actionReverse")}</li>
            <li>{t("actionDraw2")}</li>
            <li>{t("actionWild")}</li>
            <li>{t("actionWild4")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="display text-xl font-bold">{t("oneTitle")}</h2>
          <p className="text-[var(--muted)]">{t("oneBody")}</p>
        </section>
      </article>
    </main>
  );
}
