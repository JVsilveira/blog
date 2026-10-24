/* Adaptador do SPA Worker: sem servidor Next de otimização de imagens. */
/* eslint-disable @next/next/no-img-element */
import type {ImgHTMLAttributes} from 'react';
type Props=ImgHTMLAttributes<HTMLImageElement>&{unoptimized?:boolean;priority?:boolean};
export default function Image({unoptimized,priority,...props}:Props){void unoptimized;void priority;return <img {...props} alt={props.alt??''}/>;}
