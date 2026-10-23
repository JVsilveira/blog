'use client';
import { useState } from 'react';
import type { Product, SourceReference, AffiliateOffer } from '../../domain/schemas';
import { slots, type Selection } from '../../domain/pc/contracts';
import { evaluateBuild, statusLabels } from '../../domain/pc/evaluate';
import { emptySelection, slotNames, storageKey, serializeSelection, importSelection, encodeSelection, decodeSelection, selectedComplete } from './state';
import { presentOffer } from '../../domain/offers';
import { OfferLink } from '../recommendations/OfferLink';
import { analytics } from '../../lib/analytics';
export function Builder({products,sources,offers=[],affiliates=false,today}:{products:Product[];sources:SourceReference[];offers?:AffiliateOffer[];affiliates?:boolean;today:string}){
  const [selection,setSelection]=useState<Selection>(emptySelection);
  const [hide,setHide]=useState(false),[notice,setNotice]=useState(''),[link,setLink]=useState('');
  const result=evaluateBuild(selection,products);
  function apply(next:Selection){
    if(!Object.values(selection.components).some(Boolean)) analytics.track({name:'pc_builder_start'});
    setSelection(next);setLink('');setNotice('Seleção atualizada. Revise os critérios abaixo.');
    if(selectedComplete(next)) analytics.track({name:'pc_builder_complete',status:evaluateBuild(next,products).status});
  }
  function load(value:string|null,shared=false){
    if(!value){setNotice('Nenhuma seleção encontrada.');return;}
    const parsed=shared?decodeSelection(value,products):importSelection(value,products);
    if(parsed.ok){apply(parsed.selection);setNotice('Seleção carregada e reavaliada.');}else setNotice(parsed.message+' A seleção atual foi preservada.');
  }
  function local(action:'save'|'load'|'delete'){
    try{if(action==='load')load(localStorage.getItem(storageKey));else if(action==='save'){localStorage.setItem(storageKey,serializeSelection(selection));setNotice('Salvo somente neste navegador.');}else{localStorage.removeItem(storageKey);setNotice('Salvamento local apagado.');}}
    catch{setNotice('Armazenamento local indisponível ou sem espaço. A seleção continua em memória.');}
  }
  return <div className="pc-builder"><section aria-label="Seleção de componentes"><p>Selecione e revise qualquer peça. Trocas reavaliam o conjunto e preservam os outros slots. GPU e cooler separado são opcionais, sujeitos às regras de vídeo e refrigeração.</p><label><input type="checkbox" checked={hide} onChange={e=>setHide(e.target.checked)}/> Ocultar opções incompatíveis (preserva a peça atual)</label>{slots.map(slot=><div className="pc-slot" key={slot}><label htmlFor={`pc-${slot}`}>{slotNames[slot]}</label><select id={`pc-${slot}`} value={selection.components[slot]??''} onChange={e=>{analytics.track({name:'pc_builder_slot',slot});apply({...selection,components:{...selection.components,[slot]:e.target.value||null}});}}><option value="">{slot==='gpu'||slot==='cooler'?'Sem peça separada':'Selecione uma peça'}</option>{products.filter(p=>p.category===slot).map(p=>{
    const candidate=evaluateBuild({...selection,components:{...selection.components,[slot]:p.id}},products);
    const relevant=candidate.findings.filter(f=>f.componentIds.includes(p.id)&&f.ruleId!=='cooling');
    const status=relevant.some(f=>f.status==='fail')?'fail':relevant.some(f=>f.status==='unknown')?'unknown':'pass';
    return hide&&status==='fail'&&selection.components[slot]!==p.id?null:<option key={p.id} value={p.id}>{p.name} — {statusLabels[status]}</option>;
  })}</select></div>)}</section><section aria-labelledby="pc-result"><h2 id="pc-result">{statusLabels[result.status]}</h2><p>Escopo: critérios documentados abaixo. Não é garantia absoluta, teste físico ou certificação elétrica. Socket e watts isolados não confirmam compatibilidade.</p><p>{result.estimatedPowerW===undefined?'Dados insuficientes para estimar potência.':`Estimativa conservadora: ${result.estimatedPowerW} W; veja a regra de capacidade.`} Consulte os preços nas lojas.</p><ul className="pc-findings">{result.findings.map(f=><li key={f.ruleId} data-status={f.status}><strong>{statusLabels[f.status]}</strong><p>{f.ruleId}: {f.message}</p><p>Peças: {f.componentIds.map(id=>products.find(p=>p.id===id)?.name??id).join(', ')||'Seleção incompleta'}</p><p>Fontes: {f.sourceIds.length?[...new Set(f.sourceIds)].map(id=>{const s=sources.find(s=>s.id===id);return s?<a key={id} href={s.url} rel="noopener noreferrer">{s.publisher} ({s.scope.join('; ')}; acesso {s.accessedAt.slice(0,10)}) </a>:<span key={id}>{id}: evidência indisponível. </span>;}):'Sem evidência vinculada; verificar.'}</p></li>)}</ul><h2>Consultar peças nas lojas</h2><p>Links de afiliado são identificados; podemos receber comissão quando habilitados.</p>{offers.filter(o=>Object.values(selection.components).includes(o.productId)).map(o=>{const view=o.lastLinkCheck?presentOffer(o,new Date(today),affiliates):null;return <p key={o.id}>{products.find(p=>p.id===o.productId)?.name} — {o.merchant}: {view?<><OfferLink href={view.href} rel={view.rel} productId={o.productId} merchant={o.merchant}/>{view.monetized?' (afiliado)':' (link comum)'}</>:'Link a revisar; indisponível.'}</p>;})}{!offers.some(o=>Object.values(selection.components).includes(o.productId))?<p>Nenhuma oferta verificada disponível.</p>:null}</section><section aria-label="Salvar e compartilhar"><h2>Salvar e compartilhar</h2><p>A seleção fica em memória até você salvar. Limpar dados do navegador remove o salvamento; cuidado em dispositivos compartilhados. O link contém apenas IDs de peças e versão, sem dados pessoais.</p><div className="pc-actions"><button onClick={()=>local('save')}>Salvar neste dispositivo</button><button onClick={()=>local('load')}>Carregar salvamento</button><button onClick={()=>local('delete')}>Apagar salvamento</button><button onClick={()=>{setLink(`${location.origin}/pcs/montar/#build=${encodeSelection(selection)}`);setNotice('Link validado gerado. Copie o campo abaixo.');}}>Gerar link</button><button onClick={()=>load(location.hash.startsWith('#build=')?location.hash.slice(7):null,true)}>Carregar seleção do link</button><button onClick={()=>{setSelection(emptySelection());setLink('');setNotice('Seleção em memória limpa.');}}>Limpar seleção</button></div>{link?<label>Link para compartilhar<input readOnly value={link} onFocus={e=>e.target.select()}/></label>:null}<p role="status">{notice}</p></section></div>;
}
