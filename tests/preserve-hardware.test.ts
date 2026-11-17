import {it,expect} from 'vitest';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';
import {preserveHardware} from '../scripts/preserve-hardware';
it('preserva manifests e pacotes existentes do próprio site e evita rede quando já disponíveis',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'preserve-hardware-'));let calls=0;
 try{await preserveHardware(root,async input=>{calls++;const url=new URL(String(input));expect(url.origin).toBe('https://silfontech.com.br');if(url.pathname.endsWith('links.json'))return Response.json([]);if(url.pathname.endsWith('bestsellers.json'))return Response.json({updatedAt:null,expiresAt:null,category:'MLB1055',items:[]});return Response.json({updatedAt:'2026-11-16',discovered:0,unavailable:0,items:[]});});expect(calls).toBe(5);await preserveHardware(root,async()=>{throw Error('rede não esperada');});expect(JSON.parse(await readFile(path.join(root,'public/data/hardware/ram.json'),'utf8')).items).toEqual([]);}finally{await rm(root,{recursive:true,force:true});}
});
it('bloqueia build ao faltar catálogo em vez de publicar comparadores vazios',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'preserve-fail-'));try{await expect(preserveHardware(root,async()=>new Response(null,{status:404}))).rejects.toThrow('Build interrompido');}finally{await rm(root,{recursive:true,force:true});}
});
