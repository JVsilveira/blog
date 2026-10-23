import {afterEach,beforeEach,expect,it} from 'vitest';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';
import {loadHardware} from '../src/lib/hardware';
import {readInventory,publishHardwareFeed} from '../admin/lib/hardware-feed';
let root:string;
beforeEach(async()=>{root=await mkdtemp(path.join(tmpdir(),'portal-bootstrap-'));});afterEach(async()=>{await rm(root,{recursive:true,force:true});});
it('clone sem cache inicia vazio e permite a primeira publicação do scheduler',async()=>{expect(await loadHardware(root)).toEqual([]);expect((await readInventory(root)).items).toEqual([]);await publishHardwareFeed(root,[]);expect(await loadHardware(root)).toEqual([]);expect((await readInventory(root)).items).toEqual([]);});
it('não mascara catálogo corrompido ou inválido como ausência de dados',async()=>{await mkdir(path.join(root,'src/data'),{recursive:true});for(const body of ['invalid','{"schemaVersion":2,"items":[]}']){await writeFile(path.join(root,'src/data/hardware.json'),body);await expect(loadHardware(root)).rejects.toThrow();await expect(readInventory(root)).rejects.toThrow();}});
