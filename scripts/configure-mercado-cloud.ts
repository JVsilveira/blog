import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';

// Mantém os valores fora dos argumentos, logs e arquivos intermediários.
const config='cloud-admin/wrangler.jsonc';
const local=parseEnv(readFileSync('admin/.env.local','utf8'));
const id=local.MERCADOLIVRE_CLIENT_ID||local.ML_ID_APP;
const secret=local.MERCADOLIVRE_CLIENT_SECRET||local.ML_SECRET_KEY;
if(!id||!/^\d+$/.test(id)||!secret)throw new Error('Preencha Client ID e Client Secret em admin/.env.local.');
const listed=spawnSync('node_modules/.bin/wrangler',['secret','list','--config',config],{encoding:'utf8'});
if(listed.status!==0)throw new Error('Não foi possível consultar os segredos. Verifique a sessão Wrangler.');
const names=JSON.parse(listed.stdout) as {name:string}[];
const values:Record<string,string>={MERCADOLIVRE_CLIENT_ID:id,MERCADOLIVRE_CLIENT_SECRET:secret};
if(!names.some(item=>item.name==='MERCADOLIVRE_TOKEN_KEY'))values.MERCADOLIVRE_TOKEN_KEY=randomBytes(32).toString('hex');
const uploaded=spawnSync('node_modules/.bin/wrangler',['secret','bulk','--config',config],{input:JSON.stringify(values),encoding:'utf8'});
if(uploaded.status!==0)throw new Error('Não foi possível configurar os segredos. Consulte a conexão e as permissões da Cloudflare.');
console.log('Credenciais Mercado Livre configuradas na Cloudflare; chave de criptografia existente preservada.');
