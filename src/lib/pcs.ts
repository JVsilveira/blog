import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadPublicContent } from './content';
import { configurationRepository } from '../features/pc-builder/repository';
export async function loadPCs() {
  const repo=await loadPublicContent();
  const input:unknown=JSON.parse(await readFile(path.join(process.cwd(),'src/data/pc-configurations.json'),'utf8'));
  return {repo,configurations:configurationRepository(input,repo.products(),repo.sources())};
}
