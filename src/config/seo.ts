// Somente rotas estáticas reais podem receber aprovação de indexação.
export const staticSeoPaths = [
  '/ferramentas-ti/', '/', '/en/', '/es/', '/noticias/', '/opiniao/', '/blog/', '/en/news/', '/en/opinion/', '/en/blog/', '/es/news/', '/es/opinion/', '/es/blog/', '/ajuda/', '/recomendacoes/', '/celulares/', '/pcs/', '/sobre/',
  '/contato/', '/metodologia/', '/afiliados/', '/privacidade/', '/termos/',
] as const;

export function seoConfiguration(originValue?: string, indexingValue?: string, pathsValue?: string) {
  let origin: string | null = null;
  if (originValue?.trim()) {
    const url = new URL(originValue.trim());
    if (url.protocol !== 'https:' || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash ||
      url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
      url.hostname === '127.0.0.1' || url.hostname === '[::1]')
      throw new Error('NEXT_PUBLIC_SITE_URL deve ser uma origem HTTPS pública, sem caminho, credenciais ou parâmetros.');
    origin = url.origin;
  }
  if (indexingValue && !['true', 'false'].includes(indexingValue))
    throw new Error('NEXT_PUBLIC_SITE_INDEXING deve ser true ou false.');
  const indexingApproved = indexingValue === 'true';
  const approvedPaths = [...new Set((pathsValue ?? '').split(',').map(p => p.trim()).filter(Boolean))];
  for (const route of approvedPaths)
    if (!(staticSeoPaths as readonly string[]).includes(route))
      throw new Error(`Rota SEO não permitida: ${route}`);
  if (indexingApproved && !origin)
    throw new Error('Defina NEXT_PUBLIC_SITE_URL antes de liberar a indexação.');
  return { origin, seo: { indexingApproved, approvedPaths } };
}
