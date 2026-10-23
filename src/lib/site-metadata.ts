import type { Metadata } from "next";
import { site } from "../config/site";
import { pageRobots } from "../features/blog/metadata";
export const baseMetadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description:
    "Entenda o problema, compare suas opções e escolha com segurança.",
  icons: { icon: "/icon.svg" },
  ...(site.origin ? { metadataBase: new URL(site.origin) } : {}),
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION ? {
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
    },
  } : {}),
  robots: pageRobots(),
};
