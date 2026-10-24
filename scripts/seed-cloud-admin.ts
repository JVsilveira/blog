import {writeFile,mkdir} from 'node:fs/promises';
import {readWorkspace} from '../admin/lib/workspace';
const workspace=await readWorkspace(process.cwd());
const {articles,...catalog}=workspace.data;
const files=[{file:'src/data/catalog.json',contents:JSON.stringify(catalog,null,2)+'\n'},{file:'docs/editorial/controle.json',contents:JSON.stringify(workspace.operations,null,2)+'\n'}];
for(const article of articles){const {body,...metadata}=article;files.push({file:`src/content/articles/${article.slug}/article.json`,contents:JSON.stringify(metadata,null,2)+'\n'},{file:`src/content/articles/${article.slug}/body.md`,contents:body});}
const quote=(value:string)=>"'"+value.replaceAll("'","''")+"'";
const sql=files.map(({file,contents})=>`INSERT OR IGNORE INTO editorial_files(path,contents) SELECT ${quote(file)},${quote(contents)} WHERE NOT EXISTS(SELECT 1 FROM editorial_state);`).concat(`INSERT OR IGNORE INTO editorial_state(id,revision) VALUES(1,${quote(workspace.revision)});`).join('\n');
await mkdir('.editorial-admin',{recursive:true});await writeFile('.editorial-admin/cloud-seed.sql',sql,{mode:0o600});
console.log('Importação inicial preparada, preservando os estados editoriais. Não sobrescreve um banco já inicializado.');
