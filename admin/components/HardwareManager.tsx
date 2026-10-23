'use client';
import storefront from '../../src/data/affiliate-storefront.json';
import {useCallback,useEffect,useState} from 'react';
import type {HardwareJob} from '../lib/hardware';
import type {HardwareKind} from '../../src/domain/hardware/contracts';
type State={coverage:{kind:HardwareKind;discovered:number;available:number}[];job:HardwareJob|null;configured:boolean;automatic:boolean;indexUpdatedAt:string|null};
const labels={phone:'Celulares e tablets',cpu:'Processadores',ram:'Memória RAM'};
export function HardwareManager(_props:{csrf:string;building:boolean;buildMessage:string;onGenerate:()=>Promise<void>;onDirtyChange:(dirty:boolean)=>void}){
 const {csrf}= _props;
 const [url,setUrl]=useState(''),[stores,setStores]=useState({amazon:false,mercadolivre:false});
 const [state,setState]=useState<State|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=useCallback(async(signal?:AbortSignal)=>{const response=await fetch('/api/hardware?summary=1',{cache:'no-store',signal});const data=await response.json();if(!response.ok)throw new Error(data.error);return data as State;},[]);
 useEffect(()=>{const controller=new AbortController();const refresh=()=>{void load(controller.signal).then(setState).catch(error=>{if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Não foi possível carregar o catálogo.');});};refresh();const timer=setInterval(refresh,3000);return()=>{controller.abort();clearInterval(timer);};},[load]);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/hardware/link',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(data)setStores(data);}).catch(()=>{});return()=>controller.abort();},[]);
 async function importLink(){setBusy(true);setMessage('');try{const response=await fetch('/api/hardware/link',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({url})});const data=await response.json();if(!response.ok)throw new Error(data.error);setState(current=>current?{...current,job:data.job}:current);setUrl('');setMessage('Produto identificado. Importando a ficha e vinculando seu link.');}catch(error){setMessage(error instanceof Error?error.message:'Não foi possível importar o link.');}finally{setBusy(false);}}
 const running=state?.job?.state==='queued'||state?.job?.state==='running';
 async function update(){setBusy(true);setMessage('');try{const response=await fetch('/api/hardware',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({action:'sync'})});const data=await response.json();if(!response.ok)throw new Error(data.error);setState(current=>current?{...current,job:data.job}:current);}catch(error){setMessage(error instanceof Error?error.message:'Não foi possível atualizar.');}finally{setBusy(false);}}
 return <section className="hardware-manager"><h1>Produtos e comparadores</h1><p>Catálogo gratuito do Icecat, atualizado automaticamente. Os produtos entram diretamente nos comparadores.</p>
 <div className="hardware-actions"><button className="button" disabled={busy||running||!state?.configured} onClick={()=>void update()}>{running?'Atualizando catálogo…':'Atualizar catálogo agora'}</button></div>
 <p role="status">{message||state?.job?.message}</p>
 {running&&state?.job&&state.job.total>1&&<progress aria-label="Progresso da atualização" value={state.job.processed} max={state.job.total}/>}
 {state&&!state.configured&&<p className="notice">Integração indisponível. Confira o API access token no servidor.</p>}
 <p>Vitrine vinculada: <a href={storefront.href} target="_blank" rel="noopener noreferrer">Mercado Livre</a>.</p>{!stores.mercadolivre&&<p className="notice">Os produtos de afiliado e o ranking de mais vendidos aguardam a autorização da API do Mercado Livre. O link da vitrine já está disponível no site.</p>}
 <details className="hardware-section"><summary>Importar celular ou tablet por link de afiliado</summary><p>Amazon: {stores.amazon?'configurada':'aguardando configuração'}. Mercado Livre: {stores.mercadolivre?'configurado':'aguardando configuração'}.</p><form onSubmit={e=>{e.preventDefault();void importLink();}}><label className="field">Link do produto<input type="url" required maxLength={4000} value={url} onChange={e=>setUrl(e.target.value)} placeholder="Cole o link da Amazon ou do Mercado Livre"/></label><button disabled={busy||running||!state?.configured||(!stores.amazon&&!stores.mercadolivre)}>Identificar e importar</button></form><p className="muted">Cole o link de uma variante específica do aparelho. Os preços não serão preenchidos.</p></details>
 {state&&<><div className="hardware-statistics">{state.coverage.map(category=><section key={category.kind}><h2>{labels[category.kind]}</h2><p><strong>{category.available.toLocaleString('pt-BR')}</strong> disponíveis</p><p className="muted">{category.discovered.toLocaleString('pt-BR')} identificados no catálogo gratuito</p></section>)}</div>
 <p className="muted">{state.automatic?'Atualização automática ativa enquanto o servidor estiver ligado.':'Atualização automática desativada no servidor.'}{state.indexUpdatedAt?` Índice atualizado em ${new Date(state.indexUpdatedAt).toLocaleString('pt-BR')}.`:''}</p>
 <p>A primeira carga percorre o catálogo completo de celulares, tablets, processadores e memória RAM. Depois, as alterações são incorporadas automaticamente. Fichas restritas pela conta não entram no catálogo.</p>
 {state.job&&['partial','failed'].includes(state.job.state)&&<details><summary>Detalhes da última atualização</summary><ul>{state.job.results.filter(r=>r.status==='failed').slice(0,20).map((r,i)=><li key={i}>{r.id}: {r.message}</li>)}</ul></details>}
 </>}
 </section>;
}
