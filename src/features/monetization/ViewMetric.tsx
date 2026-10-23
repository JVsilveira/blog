'use client';
import { useEffect, useRef } from 'react';
import { analytics } from '../../lib/analytics';
export function ViewMetric({kind,id}:{kind:'article'|'recommendation';id:string}) {
  const last=useRef('');
  useEffect(()=>{
    const key=`${kind}:${id}`;
    if(last.current===key) return;
    last.current=key;
    analytics.track(kind==='article'?{name:'article_view',articleId:id}:{name:'recommendation_view',productId:id});
  },[kind,id]);
  return null;
}
