import { readFile } from 'node:fs/promises';
import { loadContent } from './content';
import { createPublicRepository } from './catalog';
import { phoneRepository } from '../features/phones/repository';
export async function loadPhones() {
  const [input,catalog]=await Promise.all([readFile('src/data/phones.json','utf8'),loadContent()]);
  return {phones:phoneRepository(JSON.parse(input),catalog),catalog:createPublicRepository(catalog)};
}
