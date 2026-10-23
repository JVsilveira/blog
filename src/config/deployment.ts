import {brand} from './brand';

export const productionEditorialPaths=['/','/en/','/es/','/noticias/','/blog/','/ajuda/','/en/news/','/en/blog/','/es/news/','/es/blog/'] as const;
/** Configura somente o build público. Preview/local nunca herdam a liberação de produção. */
export function publicBuildEnvironment(env:Partial<NodeJS.ProcessEnv>):NodeJS.ProcessEnv {
 const result:NodeJS.ProcessEnv={...env,NODE_ENV:env.NODE_ENV??'production'};
 if(env.CF_PAGES!=='1')return result;
 result.NEXT_PUBLIC_SITE_URL=env.NEXT_PUBLIC_SITE_URL?.trim()||brand.origin;
 if(env.CF_PAGES_BRANCH!=='main'){
  result.NEXT_PUBLIC_SITE_INDEXING='false';
  result.NEXT_PUBLIC_SEO_APPROVED_PATHS='';
  return result;
 }
 result.NEXT_PUBLIC_SITE_INDEXING=env.NEXT_PUBLIC_SITE_INDEXING?.trim()||'true';
 result.NEXT_PUBLIC_SEO_APPROVED_PATHS=env.NEXT_PUBLIC_SEO_APPROVED_PATHS?.trim()||productionEditorialPaths.join(',');
 return result;
}
