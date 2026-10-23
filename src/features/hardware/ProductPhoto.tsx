'use client';
import Image from 'next/image';
import {useState} from 'react';
import type {Locale} from '../publication/i18n';
import type {Hardware} from '../../domain/hardware/contracts';
export function ProductPhoto({item,small=false,decorative=false,locale='pt'}:{item:Pick<Hardware,'image'|'name'>;small?:boolean;decorative?:boolean;locale?:Locale}){
 const [failed,setFailed]=useState<string|null>(null),image=item.image;
 return <div className={`hardware-photo${small?' hardware-photo--small':''}`} aria-hidden={decorative||undefined}>{image&&failed!==image.src?<Image src={image.src} alt={decorative?'':image.alt} width={image.width} height={image.height} unoptimized onError={()=>setFailed(image.src)}/>:<span>{small?'—':({pt:'Foto não disponível',en:'Photo unavailable',es:'Foto no disponible'})[locale]}</span>}</div>;
}
