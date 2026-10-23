import { describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAnalytics } from '../src/lib/analytics';
import { AdSlot } from '../src/features/monetization/AdSlot';
import { approvedProgram } from '../src/config/monetization';
import sitemap from '../src/app/sitemap';
import { site } from '../src/config/site';

describe('fronteiras de monetização',()=>{
 it('no-op e produção não chamam sink ou rede, mesmo com debug',()=>{
  const sink=vi.fn(),network=vi.fn();vi.stubGlobal('fetch',network);
  for(const options of [{},{enabled:true,debug:true,environment:'production'}])
   createAnalytics({...options,sink}).track({name:'quote_export',format:'json'});
  expect(sink).not.toHaveBeenCalled();expect(network).not.toHaveBeenCalled();vi.unstubAllGlobals();
 });
 it('debug valida contrato strict e recusa PII, texto livre, URLs e eventos desconhecidos',()=>{
  const sink=vi.fn(),a=createAnalytics({enabled:true,debug:true,environment:'development',sink});
  expect(a.track({name:'article_view',articleId:'guia-backup'})).toBe(true);
  for(const input of [
   {name:'quote_export',format:'json',client:'Cliente'},
   {name:'article_view',articleId:'nome@email.com'},
   {name:'affiliate_click',productId:'produto',merchant:'loja',placement:'phone-detail',url:'https://loja.test/?tag=segredo'},
   {name:'search_result_open',contentId:'texto livre'},
   {name:'phone_compare',modelIds:['a','a']},{name:'custom',email:'nome@email.com'},
  ]) expect(a.track(input)).toBe(false);
  expect(sink).toHaveBeenCalledTimes(1);
  expect(()=>createAnalytics({enabled:true,debug:true,environment:'development',sink:()=>{throw Error();}}).track({name:'pc_builder_start'})).not.toThrow();
 });
 it('slot desligado não gera HTML, preview reserva altura sem script ou iframe',()=>{
  expect(renderToStaticMarkup(<AdSlot placement="article-end"/>)).toBe('');
  const html=renderToStaticMarkup(<AdSlot placement="article-end" preview/>);
  expect(html).toContain('Publicidade desativada');expect(html).not.toMatch(/<script|<iframe|<img|<ins/);
 });
 it('programa exige aprovação, validade, canal e domínio exatos',()=>{
  const now=new Date('2026-10-22T12:00:00Z'),origin='https://portal.test';
  const program={id:'loja',merchant:'loja',enabled:true,approvedAt:'2026-10-01T00:00:00Z',termsReviewedAt:'2026-10-01T00:00:00Z',validUntil:'2026-11-01T00:00:00Z',channelOrigin:origin,allowedHosts:['loja.test'],disclosure:'Podemos receber comissão.'};
  expect(approvedProgram('loja','https://loja.test/item',origin,now,[program])).toEqual(program);
  expect(approvedProgram('loja','https://loja.test.evil.test/',origin,now,[program])).toBeNull();
  expect(approvedProgram('loja','https://loja.test/',null,now,[program])).toBeNull();
  expect(approvedProgram('loja','https://loja.test/',origin,new Date('2026-12-01'),[program])).toBeNull();
 });
 it('sitemap permanece vazio sem aprovação e exclui drafts e filtros ao configurar origem',async()=>{
  expect(await sitemap()).toEqual([]);
  const previous={origin:site.origin,seo:site.seo};
  try {
   Object.assign(site,{origin:'https://portal.test',seo:{indexingApproved:true,approvedPaths:['/','/ajuda/','/ajuda/?busca=x','/celulares/comparar/','/privacidade/']}});
   const urls=(await sitemap()).map(x=>x.url);
   expect(urls).toContain('https://portal.test/');
   expect(urls).not.toContain('https://portal.test/ajuda/'); // coleção sem artigos publicados
   expect(urls.join(' ')).not.toMatch(/backup-windows|backup-antes|\?|comparar|sem-publicacao/);
  } finally {Object.assign(site,previous);}
 });
});
