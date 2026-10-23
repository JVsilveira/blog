import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { hardwareCatalogSchema } from '../domain/hardware/contracts';
export async function readHardwareCatalog(root=process.cwd()){
 try{return hardwareCatalogSchema.parse(JSON.parse(await readFile(path.join(root,'src/data/hardware.json'),'utf8')));}
 catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return hardwareCatalogSchema.parse({schemaVersion:1,items:[]});throw error;}
}
export async function loadHardware(root=process.cwd()) {
 const data=await readHardwareCatalog(root);
 const count={phone:0,cpu:0,ram:0};
 return data.items.filter(item=>item.status==='published'&&!item.demonstration).filter(item=>item.publication!=='provider'||count[item.kind]++<6);
 // Full provider catalogues are loaded from static manifests; only a small
 // sample is embedded in initial HTML, never thousands of full datasheets.
}
