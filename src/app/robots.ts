import { site } from '../config/site';
import type { MetadataRoute } from 'next';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  if (!site.origin || !site.seo.indexingApproved)
    return {rules:{userAgent:'*', disallow:'/'}};
  // A regra geral também permite OAI-SearchBot e os demais buscadores.
  // O painel editorial é uma aplicação privada separada.
  return {
    rules:{userAgent:'*', allow:'/', disallow:['/admin/', '/auth/', '/api/']},
    sitemap:new URL('/sitemap.xml',site.origin).href,
  };
}
