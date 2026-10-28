import { safeJson } from "../blog/metadata";
import { site } from "../../config/site";
import { homePath, localeTags } from "./i18n";
import { loadPublicContent } from "../../lib/content";

import { copy, type Locale, type PublicationKind } from "./i18n";
import {
  localizeArticle,
  homeLanguages,
  orderedPublications,
  matchesPublicationKind,
} from "./model";
import { LanguageChoice } from "./LanguageChoice";
import { PortalList } from "./PortalList";
export const sectionPath = (key: string, locale: Locale) =>
  locale === "pt" ? `/editorias/${key}/` : `/${locale}/sections/${key}/`;
export const kindPath = (kind: PublicationKind, locale: Locale) =>
  locale === "pt"
    ? `/${kind === "blog" ? "blog" : "noticias"}/`
    : `/${locale}/${kind === "blog" ? "blog" : "news"}/`;
export async function PortalPage({
  locale,
  kind,
  section,
}: {
  locale: Locale;
  kind?: PublicationKind;
  section?: string;
}) {
  const repo = await loadPublicContent();
  const c = copy[locale];
  const originals = orderedPublications(repo.articles()).filter(
    (a) =>
      matchesPublicationKind(a, kind) &&
      (!section ||
        a.category.toLocaleLowerCase("pt-BR") ===
          copy.pt[section as keyof typeof copy.pt]?.toLocaleLowerCase("pt-BR")),
  );
  const entries = originals
    .map((a) => localizeArticle(a, locale))
    .filter((a) => a !== null)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.description,
      category: a.category,
      kind: a.kind,
      featuredOrder: a.featuredOrder,
    }));
  const title = kind
    ? c[kind === "blog" ? "blog" : "news"]
    : section
      ? c[section as keyof typeof c]
      : c.heading;
  return (
    <main id="conteudo" tabIndex={-1} className="portal-page">
      {!kind && !section && site.origin && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJson({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: site.name,
              url: new URL(homePath(locale), site.origin).href,
              inLanguage: localeTags[locale],
            }),
          }}
        />
      )}
      <div className="publication-hero">
        <div className="publication-heading">
          <h1>{title}</h1>
        </div>
        <LanguageChoice
          locale={locale}
          links={
            kind
              ? {
                  pt: kindPath(kind, "pt"),
                  en: kindPath(kind, "en"),
                  es: kindPath(kind, "es"),
                }
              : section
                ? {
                    pt: sectionPath(section, "pt"),
                    en: sectionPath(section, "en"),
                    es: sectionPath(section, "es"),
                  }
                : homeLanguages
          }
          automatic={!kind && !section && locale === "pt"}
        />
      </div>

      <section aria-label={c.latest}>
        <PortalList entries={entries} locale={locale} />
      </section>
    </main>
  );
}
