import path from 'node:path';import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {storeLinksSchema,type StoreLink} from '../../src/domain/hardware/retailers';
// Called under the existing workspace lock, after the product is persisted.
export async function saveHardwareLink(root:string,link:StoreLink){
 const privateFile=path.join(root,'.editorial-admin/hardware-links.json');let links:StoreLink[]=[];try{links=storeLinksSchema.parse(JSON.parse(await readFile(privateFile,'utf8')));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 links=links.filter(i=>i.hardwareId!==link.hardwareId||i.retailer!==link.retailer);links.push(link);const body=JSON.stringify(storeLinksSchema.parse(links));
 for(const [target,mode] of [[privateFile,0o600],[path.join(root,'public/data/hardware/links.json'),0o644],[path.join(root,'out/data/hardware/links.json'),0o644]] as const){await mkdir(path.dirname(target),{recursive:true});const temp=target+'.tmp-'+process.pid;await writeFile(temp,body,{mode});await rename(temp,target);}
}
