import Image from 'next/image';
import {brand} from '../config/brand';

/** Contornos vetoriais da assinatura fornecida pelo proprietário. */
export function BrandLogo(){
 return <Image className="brand-logo" src={brand.logo} alt={brand.name} width={2050} height={470} loading="eager" unoptimized />;
}
