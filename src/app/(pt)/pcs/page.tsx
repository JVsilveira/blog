import { loadPCs } from '../../../lib/pcs';
import { PCListing } from '../../../features/pc-builder/Views';
import { listingMetadata } from '../../../features/blog/metadata';
export const metadata=listingMetadata('Configurações de PCs','Configurações editoriais com compatibilidade explicável, fontes e limitações.','/pcs/');
export default async function Page(){const {configurations}=await loadPCs();return <PCListing items={configurations.all()}/>;}
