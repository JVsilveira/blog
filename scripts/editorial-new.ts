import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { id, articleSchema } from '../src/domain/schemas';
const slug = process.argv[2];
try {
  id.parse(slug);
  if (slug === 'sem-publicacao') throw new Error('Slug reservado');
  const date = new Date().toISOString();
  const template = JSON.parse(await readFile('templates/editorial/article.json','utf8'));
  const body = await readFile('templates/editorial/body.md','utf8');
  const metadata = {...template, id: slug, slug, createdAt: date, updatedAt: date};
  articleSchema.parse({...metadata, body});
  const folder = path.join('src/content/articles', slug!);
  await mkdir(folder); // Sem recursive: nunca sobrescrever conteúdo existente.
  try {
    await writeFile(path.join(folder,'article.json'),JSON.stringify(metadata,null,2)+'\n', {flag:'wx'});
    await writeFile(path.join(folder,'body.md'),body, {flag:'wx'});
  } catch (error) { await rm(folder,{recursive:true,force:true}); throw error; }
  console.log('Draft criado. Preencha conteúdo/fontes e registre proprietário/revisor em docs/editorial/controle.json. Não houve aprovação ou publicação.');
} catch {
  console.error('Cadastro recusado: use npm run editorial:new -- slug-valido; confira templates e se o diretório já existe. Nenhum conteúdo existente foi sobrescrito.');
  process.exitCode = 1;
}
