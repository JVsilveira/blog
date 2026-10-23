'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {createHardwareSearch} from '../../domain/hardware/search';
import {hardwareText} from './i18n';
import type {Locale} from '../publication/i18n';
import {ProductPhoto} from './ProductPhoto';
import type {HardwareOption} from './Comparator';
export function ModelPicker({label,items,selected,disabledIds,onSelect,locale='pt',affiliateIds=[]}:{affiliateIds?:string[];locale?:Locale;label:string;items:HardwareOption[];selected:HardwareOption|undefined;disabledIds:string[];onSelect:(id:string)=>void}){
 const t=(text:string)=>hardwareText(text,locale);
 const id=useId(),input=useRef<HTMLInputElement>(null),box=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),[above,setAbove]=useState(false),[maxHeight,setMaxHeight]=useState(320);
 const search=useMemo(()=>createHardwareSearch(items),[items]);const results=search(query),current=Math.min(active,Math.max(0,results.length-1));
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
 useEffect(()=>{if(open)document.getElementById(`${id}-${current}`)?.scrollIntoView?.({block:'nearest'});},[open,current,id]);
 function place(){const rect=box.current?.getBoundingClientRect();if(!rect)return;const below=innerHeight-rect.bottom-12,up=rect.top-40,flip=below<220&&up>below;setAbove(flip);setMaxHeight(Math.max(100,Math.min(320,(flip?up:below)-36)));}
 function show(){place();setQuery('');setOpen(true);setActive(0);}
 function choose(item:HardwareOption){if(disabledIds.includes(item.id))return;onSelect(item.id);setOpen(false);setQuery('');}
 function move(step:number){setOpen(true);let next=current;for(let i=0;i<results.length;i++){next=(next+step+results.length)%results.length;if(!disabledIds.includes(results[next]!.id)){setActive(next);return;}}}
 return <div className="model-picker" ref={box} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
 <label htmlFor={id}>{label}</label><div className={`model-picker-control${open?' is-open':''}`}>
 {selected&&<ProductPhoto locale={locale} small decorative item={{image:selected.image,name:selected.name}}/>}
 <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open&&results.length?`${id}-${current}`:undefined} autoComplete="off" placeholder={t('Buscar e selecionar')} value={open?query:selected?.name??''} onFocus={show} onClick={()=>{if(!open)show();}} onChange={e=>{setQuery(e.target.value);setOpen(true);setActive(0);}} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open){setOpen(true);setActive(0);}else move(e.key==='ArrowDown'?1:-1);}else if(e.key==='Enter'&&open){e.preventDefault();if(results[current])choose(results[current]);}else if(e.key==='Escape'){e.preventDefault();setOpen(false);}else if(e.key==='Tab')setOpen(false);}}/>
 <button type="button" className="model-picker-toggle" aria-label={`${t('Abrir opções de')} ${label}`} tabIndex={-1} onClick={()=>{if(open)setOpen(false);else{show();input.current?.focus();}}}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg></button>
 </div>
 {open&&<div className={`model-picker-popup${above?' model-picker-popup--above':''}`}><div id={`${id}-list`} role="listbox" aria-label={label} className="model-picker-options" style={{maxHeight}}>{results.length?results.map((item,index)=><button type="button" role="option" id={`${id}-${index}`} key={item.id} tabIndex={-1} disabled={disabledIds.includes(item.id)} aria-selected={selected?.id===item.id} className={current===index?'is-active':''} onPointerMove={()=>setActive(index)} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(item)}><ProductPhoto locale={locale} small decorative item={{image:item.image,name:item.name}}/><span><strong>{item.name}</strong><small>{item.modelCode}{item.deviceType==='tablet'?' · Tablet':''}{affiliateIds.includes(item.id)?' · '+t('Link de afiliado'):''}</small></span>{selected?.id===item.id&&<span aria-hidden="true">✓</span>}</button>):<p className="model-picker-empty">{t('Nenhum modelo encontrado. Tente só a marca ou o nome do aparelho.')}</p>}</div><small className="model-picker-count">{results.length} {t('resultados')}</small></div>}

 </div>;
}
