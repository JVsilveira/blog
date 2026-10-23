import path from 'node:path';
import {readHardwareCatalog} from '../../src/lib/hardware';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,rename,stat,readFile} from 'node:fs/promises';
import {z} from 'zod';
import {hardwareSchema,hardwareCatalogSchema,type Hardware} from '../../src/domain/hardware/contracts';
import {hardwareSummarySchema,type HardwareFeed,type HardwareSummary} from '../../src/domain/hardware/feed';
export const inventorySchema=hardwareSummarySchema.extend({status:z.enum(['draft','published','archived']),publication:z.literal('provider'),updatedAt:z.string(),lastSyncedAt:z.string().optional(),syncVersion:z.number().optional()});
export type InventoryItem=z.infer<typeof inventorySchema>;
export type StoredHardware=Hardware|InventoryItem;
async function atomic(target:string,body:string){await mkdir(path.dirname(target),{recursive:true});const temp=target+'.tmp-'+process.pid;await writeFile(temp,body,{mode:0o644});await rename(temp,target);}
export async function readInventory(root:string):Promise<{schemaVersion:1;items:StoredHardware[]}>{
 const seed=await readHardwareCatalog(root);
 let stored:InventoryItem[]=[];try{stored=z.array(inventorySchema).parse(JSON.parse(await readFile(path.join(root,'.editorial-admin/hardware-inventory.json'),'utf8')));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const records=new Map<string,StoredHardware>(seed.items.map(i=>[i.id,i]));for(const item of stored)records.set(item.id,item);return {schemaVersion:1,items:[...records.values()]};
}
export async function expandHardware(root:string,item:StoredHardware):Promise<Hardware>{return 'asset' in item?{...hardwareSchema.parse(JSON.parse(await readFile(path.join(root,'public',item.asset),'utf8'))),status:item.status,lastSyncedAt:item.lastSyncedAt}:item;}
// Immutable files first, inventory next, public manifests last. A large catalogue
// stays as small summaries in memory; only selected/replaced datasheets are read.
export async function publishHardwareFeed(root:string,items:StoredHardware[],coverage:{kind:string;icecatId?:string}[]=[],failedIds:string[]=[]){
 for(const base of ['public','out']){const file=path.join(root,base,'data/hardware/links.json');try{await stat(file);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;await atomic(file,'[]');}}
 const inventory:InventoryItem[]=[];
 for(const value of items.filter(i=>i.publication==='provider'&&i.status!=='draft')){
  if('asset' in value){inventory.push(value.kind==='phone'&&value.image===undefined?{...value,image:(await expandHardware(root,value)).image??null}:value);continue;}
  const item=hardwareSchema.parse(value);if(item.demonstration)continue;const body=JSON.stringify(item),hash=createHash('sha256').update(body).digest('hex').slice(0,16),asset=`/data/hardware/${item.id}-${hash}.json`;
  for(const base of ['public','out']){const target=path.join(root,base,asset);try{await stat(target);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;await atomic(target,body);}}
  inventory.push({id:item.id,kind:item.kind,image:item.image??null,deviceType:item.deviceType,syncVersion:item.syncVersion,name:item.name,brand:item.brand,modelCode:item.modelCode,variant:item.variant,asset,status:item.status,publication:'provider',updatedAt:item.updatedAt,lastSyncedAt:item.lastSyncedAt});
 }
 const privateDir=path.join(root,'.editorial-admin');await mkdir(privateDir,{recursive:true,mode:0o700});await atomic(path.join(privateDir,'hardware-inventory.json'),JSON.stringify(inventory));
 const failed=new Set(failedIds),published=inventory.filter(i=>i.status==='published');
 for(const kind of ['phone','cpu','ram'] as const){const data:HardwareFeed={updatedAt:new Date().toISOString(),discovered:coverage.filter(i=>i.kind===kind).length,unavailable:coverage.filter(i=>i.kind===kind&&failed.has(i.icecatId??'')).length,items:published.filter(i=>i.kind===kind).sort((a,b)=>a.name.localeCompare(b.name)||a.modelCode.localeCompare(b.modelCode)).map(({id,kind,image,deviceType,name,brand,modelCode,variant,asset}):HardwareSummary=>({id,kind,image,deviceType,name,brand,modelCode,variant,asset}))};
  for(const base of ['public','out'])await atomic(path.join(root,base,`data/hardware/${kind}.json`),JSON.stringify(data));
 }
 const sample:Hardware[]=items.filter((i):i is Hardware=>!('asset' in i)&&i.publication!=='provider');
 for(const kind of ['phone','cpu','ram'] as const)for(const record of published.filter(i=>i.kind===kind).slice(0,6))sample.push(await expandHardware(root,record));
 const target=path.join(root,'src/data/hardware.json');await atomic(target,JSON.stringify(hardwareCatalogSchema.parse({schemaVersion:1,items:sample}))+'\n');
 return [...sample.filter(i=>i.publication!=='provider'),...inventory];
}
