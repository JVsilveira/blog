import { describe, expect, it } from 'vitest';
import { fixture } from './fixtures/catalog';
import { validateCatalog, createPublicRepository } from '../src/lib/catalog';
import { presentOffer } from '../src/domain/offers';
import { offerSchema } from '../src/domain/schemas';
import { loadContent } from '../src/lib/content';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('integridade do conteúdo', () => {
  it('rejeita IDs e slugs duplicados', () => {
    const data = fixture(); data.products.push(structuredClone(data.products[0]!));
    expect(() => validateCatalog(data)).toThrow(/duplicado/);
    data.products[1]!.id = 'another';
    expect(() => validateCatalog(data)).toThrow(/slug duplicado/);
  });
  it.each(['sources', 'authors', 'products'] as const)('rejeita referência quebrada em %s', collection => {
    const data = fixture(); data[collection] = [];
    expect(() => validateCatalog(data)).toThrow(/referência inexistente/);
  });
  it('bloqueia relações públicas para drafts e publicação sem aprovação', () => {
    const data = fixture(); data.sources[0]!.status = 'draft';
    expect(() => validateCatalog(data)).toThrow(/não publicada/);
    const product = fixture(); product.products[0]!.ownerApprovedAt = null;
    expect(() => validateCatalog(product)).toThrow(/aprovação/);
  });
  it('rejeita campos desconhecidos, datas inválidas, estados e links perigosos', () => {
    for (const patch of [{ extra: true }, { updatedAt: '2026-02-30T00:00:00Z' }, { status: 'ready' }, { url: 'javascript:alert(1)' }, { url: 'https://user:password@example.org' }]) {
      const data = fixture(); Object.assign(data.sources[0]!, patch);
      expect(() => validateCatalog(data)).toThrow();
    }
  });
  it('preserva false e null sem aprovar compatibilidade desconhecida', () => {
    const cpu = validateCatalog(fixture()).products[0]!.specs;
    expect(cpu.category === 'cpu' && cpu.integratedGraphics).toBe(false);
    expect(cpu.category === 'cpu' && cpu.socket).toBeNull();
  });
  it('não publica hands-on sem confirmação', () => {
    const data = fixture();
    data.reviews.push({ id: 'review-test', schemaVersion: 1, status: 'published', createdAt: data.sources[0]!.createdAt, updatedAt: data.sources[0]!.updatedAt, productId: 'product-test', method: 'hands-on', ownerApprovedAt: null, pros: [], cons: [], bestFor: [], avoidIf: [], uses: [], alternativeProductIds: [] });
    expect(() => validateCatalog(data)).toThrow(/Hands-on/);
  });
  it('isola drafts de detalhes, listagens, parâmetros, busca e ofertas', () => {
    const data = fixture();
    data.articles[0]!.status = 'draft'; data.products[0]!.status = 'draft'; data.offers[0]!.status = 'draft';
    const repo = createPublicRepository(data);
    expect(repo.articles()).toEqual([]); expect(repo.products()).toEqual([]);
    expect(repo.articleBySlug('article-test')).toBeNull(); expect(repo.productBySlug('product-test')).toBeNull();
    expect(repo.articleParams()).toEqual([]); expect(repo.searchIndex()).toEqual([]); expect(repo.offersFor('product-test')).toEqual([]);
  });
  it('não permite mutação externa do repositório', () => {
    const repo = createPublicRepository(fixture()); repo.articles()[0]!.title = 'Mutação';
    expect(repo.articleBySlug('article-test')!.title).toBe('Artigo sintético');
  });
  it('carrega alterações locais sem alterar componentes e mantém produção sem fixtures', async () => {
    expect(JSON.stringify(await loadContent())).not.toMatch(/CPU sintética|Artigo sintético|Loja sintética/);
    const root = await mkdtemp(path.join(tmpdir(), 'portal-content-'));
    try {
      await mkdir(path.join(root, 'src/data'), { recursive: true });
      const folder = path.join(root, 'src/content/articles/article-test'); await mkdir(folder, { recursive: true });
      const { articles, ...catalog } = fixture(); const { body, ...metadata } = articles[0]!;
      await writeFile(path.join(root, 'src/data/catalog.json'), JSON.stringify(catalog));
      await writeFile(path.join(folder, 'article.json'), JSON.stringify(metadata));
      await writeFile(path.join(folder, 'body.md'), body);
      expect(createPublicRepository(await loadContent(root)).articleBySlug('article-test')!.body).toBe(body);
      await writeFile(path.join(folder, 'body.md'), 'Conteúdo alterado.');
      expect(createPublicRepository(await loadContent(root)).articleBySlug('article-test')!.body).toBe('Conteúdo alterado.');
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});

describe('ofertas', () => {
  const now = new Date('2026-10-02T12:00:00Z');
  it('usa link normal por padrão, sem preço e sem tracking inventado', () => {
    const offer = fixture().offers[0]!;
    expect(presentOffer(offer, now)).toMatchObject({ href: offer.destinationUrl, monetized: false, priceCents: null });
    expect(presentOffer(offer, now, true)?.monetized).toBe(false); // Sem programa/canal aprovado, flag não monetiza.
    delete offer.affiliateUrl;
    expect(presentOffer(offer, now, true)?.monetized).toBe(false);
    offer.enabled = false; expect(presentOffer(offer, now)).toBeNull();
  });
  it('rejeita preços fracionários/negativos, política sem autorização e links maliciosos', () => {
    for (const patch of [{ priceCents: 0.5 }, { priceCents: -1 }, { pricePolicy: 'authorized-feed' }, { destinationUrl: 'data:text/html,x' }]) expect(() => offerSchema.parse({ ...fixture().offers[0], ...patch })).toThrow();
  });
  it('mostra zero autorizado e oculta preço vencido, futuro ou sem autorização vigente', () => {
    const offer = offerSchema.parse({ ...fixture().offers[0], pricePolicy: 'authorized-feed', priceCents: 0, observedAt: '2026-10-02T11:00:00Z', expiresAt: '2026-10-03T12:00:00Z', authorization: { sourceId: 'source-test', validUntil: '2026-10-04T12:00:00Z', maxAgeHours: 2 } });
    expect(presentOffer(offer, now)?.priceCents).toBe(0);
    expect(presentOffer(offer, new Date('2026-10-02T14:00:00Z'))?.priceCents).toBeNull();
    expect(presentOffer(offer, new Date('2026-10-02T10:00:00Z'))?.priceCents).toBeNull();
    offer.authorization!.validUntil = '2026-10-02T11:30:00Z';
    expect(presentOffer(offer, now)?.priceCents).toBeNull();
  });
});
