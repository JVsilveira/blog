'use client';
import {useEffect,useState,useMemo,useSyncExternalStore} from 'react';
import {hardwareSchema,type Hardware,type HardwareKind} from '../../domain/hardware/contracts';
import {hardwareFeedSchema,type HardwareFeed} from '../../domain/hardware/feed';
import {isMobileDevice} from '../../domain/hardware/devices';
import {phoneRankingSchema,type PhoneRanking} from '../../domain/hardware/bestsellers';
import {storeLinksSchema,type StoreLink} from '../../domain/hardware/retailers';
import {hardwareLocale,hardwareText} from './i18n';
import {localeTags,type Locale} from '../publication/i18n';
import {readLanguagePreference,writeLanguagePreference,languagePreferenceEvent} from '../publication/language-preference';
import {HardwareComparator} from './Comparator';
function subscribeLanguage(listener:()=>void){for(const event of ['storage','popstate','languagechange',languagePreferenceEvent])window.addEventListener(event,listener);return()=>{for(const event of ['storage','popstate','languagechange',languagePreferenceEvent])window.removeEventListener(event,listener);};}
function readLanguage(){let saved:string|null=null;try{saved=readLanguagePreference(localStorage);}catch{}return hardwareLocale(new URL(location.href).searchParams.get('lang')??saved,navigator.languages,location.pathname);}
export function HardwareExplorer({items,kind,kindLabel,path}:{items:Hardware[];kind:HardwareKind;kindLabel:string;path:string}){
 const locale=useSyncExternalStore(subscribeLanguage,readLanguage,()=> 'pt' as Locale);
 const t=(text:string)=>hardwareText(text,locale);
 function chooseLocale(value:Locale){try{writeLanguagePreference(localStorage,value);}catch{}const url=new URL(location.href);url.searchParams.set('lang',value);history.replaceState(null,'',url);window.dispatchEvent(new Event(languagePreferenceEvent));}
 const [ranking,setRanking]=useState<PhoneRanking|null>(null);
 useEffect(()=>{if(kind!=='phone')return;const controller=new AbortController();const refresh=()=>{void fetch('/data/hardware/bestsellers.json',{cache:'no-store',signal:controller.signal}).then(async r=>r.ok?phoneRankingSchema.parse(await r.json()):null).then(value=>{if(!controller.signal.aborted)setRanking(value);}).catch(()=>{});};refresh();const timer=setInterval(refresh,60000);return()=>{controller.abort();clearInterval(timer);};},[kind]);
 const [links,setLinks]=useState<StoreLink[]>([]);
 const [feed,setFeed]=useState<HardwareFeed|null>(null),[loaded,setLoaded]=useState<Record<string,Hardware>>(()=>Object.fromEntries(items.map(i=>[i.id,i]))),[ids,setIds]=useState<string[]>([]),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();const refresh=()=>{void fetch(`/data/hardware/${kind}.json`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(response.status===404)return null;if(!response.ok)throw new Error();return hardwareFeedSchema.parse(await response.json());}).then(value=>{if(!controller.signal.aborted&&value)setFeed(value);}).catch(()=>{if(!controller.signal.aborted)setError('Não foi possível atualizar a lista. Os modelos já carregados continuam disponíveis.');});};refresh();const timer=setInterval(refresh,60000);return()=>{controller.abort();clearInterval(timer);};},[kind]);
 useEffect(()=>{if(kind!=='phone')return;const controller=new AbortController();const refresh=()=>{void fetch('/data/hardware/links.json',{cache:'no-store',signal:controller.signal}).then(async r=>r.ok?storeLinksSchema.parse(await r.json()):[]).then(setLinks).catch(()=>{});};refresh();const timer=setInterval(refresh,60000);return()=>{controller.abort();clearInterval(timer);};},[kind]);
 const options=useMemo(()=>(feed?[...items.filter(i=>i.publication!=='provider'),...feed.items]:items).filter(i=>i.kind===kind&&(kind!=='phone'||isMobileDevice(i))),[feed,items,kind]);
 useEffect(()=>{
  const needed=ids.filter(id=>!loaded[feed?.items.find(i=>i.id===id)?.asset??id]);if(!needed.length)return;const controller=new AbortController();
  void Promise.all(needed.map(async id=>{const summary=feed?.items.find(i=>i.id===id);if(!summary)throw new Error('Modelo indisponível.');const response=await fetch(summary.asset,{signal:controller.signal});if(!response.ok)throw new Error();const item=hardwareSchema.parse(await response.json());if(item.id!==id||item.kind!==kind||(kind==='phone'&&!isMobileDevice(item))||item.status!=='published'||item.demonstration)throw new Error();return {item,asset:summary.asset};})).then(records=>{if(!controller.signal.aborted){setLoaded(current=>({...current,...Object.fromEntries(records.map(({item,asset})=>[asset,item]))}));setError('');}}).catch(()=>{if(!controller.signal.aborted)setError('Não foi possível carregar a ficha. Tente novamente.');});
  return()=>controller.abort();
 },[ids,feed,kind,loaded,retry]);
 const ready=options.flatMap(option=>loaded['asset' in option?option.asset:option.id]??[]),waiting=ids.some(id=>!loaded[feed?.items.find(i=>i.id===id)?.asset??id]);
 return <div lang={localeTags[locale]}><label className="comparison-language">{({pt:'Idioma',en:'Language',es:'Idioma'})[locale]}<select value={locale} onChange={e=>chooseLocale(e.target.value as Locale)}><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></label>{feed&&<p className="muted">{options.length.toLocaleString(localeTags[locale])} {t('modelos disponíveis')} · {t('Atualizado em')} {new Date(feed.updatedAt).toLocaleDateString(localeTags[locale],{timeZone:'UTC'})}</p>}
 <HardwareComparator ranking={ranking} locale={locale} links={links} devices={kind==='phone'} items={ready} options={options} onSelection={setIds} kindLabel={kindLabel} path={path}/>
 {waiting&&!error&&<p role="status">{t('Carregando as fichas selecionadas…')}</p>}{error&&<p role="status">{t(error)} <button className="button secondary" onClick={()=>{setError('');setRetry(value=>value+1);}}>{t('Tentar novamente')}</button></p>}
 <p><a href="https://icecat.biz/">Specs Icecat</a>. Database Right data-sheet {new Date().getFullYear()} Icecat. All rights reserved. Dados disponibilizados como estão, sem garantia. <a href="https://iceclog.com/open-content-license/">Open Icecat Open Content License</a>.</p></div>;
}
