import { seoConfiguration } from "./seo";
import {brand} from './brand';
export const site = {
  name: brand.name, author: 'João',
  ...seoConfiguration(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_INDEXING,
    process.env.NEXT_PUBLIC_SEO_APPROVED_PATHS,
  ),
  features: { blog: true, recommendations: true, pcConfigurations: false, pcBuilder: false, phones: true, quotes: true, affiliates: false, adsense: false, analytics: false },
} as const;
