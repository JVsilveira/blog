import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { pcFixture } from './fixtures/pcs';
import { evaluateBuild,resolveSelection } from '../src/domain/pc/evaluate';
import { configurationRepository } from '../src/features/pc-builder/repository';
import { PCListing,PCDetail } from '../src/features/pc-builder/Views';
import type { Product } from '../src/domain/schemas';
function scenario(category:Product['category'],patch:object){const f=pcFixture();const p=f.products.find(p=>p.category===category)!;Object.assign(p.specs,patch);return evaluateBuild(f.configuration.selection,f.products);}
const check=(result:ReturnType<typeof evaluateBuild>,id:string)=>result.findings.find(f=>f.ruleId===id)?.status;
describe('compatibilidade explicável',()=>{
 it('aprova apenas conjunto conhecido e preserva evidências',()=>{const f=pcFixture();const r=evaluateBuild(f.configuration.selection,f.products);expect(r.status).toBe('pass');expect(r.findings.every(f=>f.sourceIds.length>0||f.status==='not-applicable')).toBe(true);});
 it.each([
 ['cpu',{socket:'outro'},'socket','fail'],['motherboard',{installedBios:null},'bios','unknown'],['ram',{type:'DDR4'},'ram-type','fail'],['case',{supportedBoardFormats:['ITX']},'board-case','fail'],['gpu',{lengthMm:400},'gpu-length','fail'],['gpu',{lengthMm:null},'gpu-length','unknown'],['cooler',{heightMm:200},'cooler-height','fail'],['psu',{connectors:{ATX:1,EPS:1}},'power-connectors','fail'],['ram',{kitCount:8},'ram-slots','fail'],['ram',{moduleCapacityGB:128},'ram-capacity','fail'],['motherboard',{storageSlots:[{id:'m2-1',interface:'NVMe',formFactors:['2280'],available:false}]},'storage-slot','fail'],['motherboard',{lanesVerified:null},'lanes','unknown'],['ram',{profileSupport:['XMP']},'memory-profile','unknown'],['cpu',{powerEstimateW:null},'power-capacity','unknown'],['psu',{continuousPowerW:100},'power-capacity','fail'],
 ] as const)('%s %j → %s %s',(category,patch,rule,status)=>{const r=scenario(category,patch);expect(check(r,rule)).toBe(status);expect(r.status).not.toBe('pass');});
 it('sem GPU e sem iGPU falha; GPU opcional com caminho válido não se aplica',()=>{const f=pcFixture();f.configuration.selection.components.gpu=null;expect(check(evaluateBuild(f.configuration.selection,f.products),'gpu-length')).toBe('not-applicable');Object.assign(f.products[0]!.specs,{integratedGraphics:false});expect(check(evaluateBuild(f.configuration.selection,f.products),'video')).toBe('fail');});
 it('troca de CPU reavalia matriz e BIOS sem alterar placa',()=>{const f=pcFixture();f.products.push({...f.products[0]!,id:'new-cpu'});f.configuration.selection.components.cpu='new-cpu';const r=evaluateBuild(f.configuration.selection,f.products);expect(check(r,'cpu-support')).toBe('fail');expect(check(r,'bios')).toBe('unknown');});
 it('import inválido/removido é recuperável, sem substituição',()=>{const f=pcFixture();expect(resolveSelection({schemaVersion:2},f.products).ok).toBe(false);f.configuration.selection.components.cpu='removida';expect(resolveSelection(f.configuration.selection,f.products)).toMatchObject({ok:false,message:expect.stringContaining('Peça removida')});});
 it('não mostra potência precisa com dados incompletos; valida margem',()=>{expect(scenario('cpu',{powerEstimateW:null}).estimatedPowerW).toBeUndefined();const f=pcFixture();expect(()=>evaluateBuild(f.configuration.selection,f.products,0)).toThrow();});
 it('placa sem CPU selecionada mantém suporte desconhecido',()=>{const f=pcFixture();f.configuration.selection.components.cpu=null;expect(check(evaluateBuild(f.configuration.selection,f.products),'cpu-support')).toBe('unknown');});
 it('fail vence unknown',()=>{const f=pcFixture();Object.assign(f.products[0]!.specs,{socket:'diferente',powerEstimateW:null});expect(evaluateBuild(f.configuration.selection,f.products).status).toBe('fail');});
});
describe('publicação e UI 5A',()=>{
 it('draft não vaza; aprovação, fonte, categoria e motivo são exigidos',()=>{const f=pcFixture();const repo=()=>configurationRepository({schemaVersion:1,configurations:[f.configuration]},f.products,f.sources);expect(repo().all()).toHaveLength(1);f.configuration.status='draft';expect(repo().all()).toEqual([]);f.configuration.status='published';f.configuration.ownerApprovedAt=null;expect(repo).toThrow();});
 it('HTML tem regra, fonte, motivo, vazio e limitações sem dados de demo implícitos',()=>{const f=pcFixture();const html=renderToStaticMarkup(<PCDetail configuration={f.configuration} products={f.products} sources={f.sources} offers={[]} now={new Date('2026-10-21')}/>);for(const text of ['Compatível nos critérios verificados','Motivo sintético','Fontes','Não é garantia absoluta','Nenhuma oferta verificada'])expect(html).toContain(text);expect(renderToStaticMarkup(<PCListing items={[]}/>)).toContain('Configurações em revisão');});
});
