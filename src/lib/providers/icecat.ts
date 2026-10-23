import {importIcecatImage} from './icecat-media';
import { z } from 'zod';
import { hardwareSchema, type HardwareKind } from '../../domain/hardware/contracts';
const value=z.union([z.string(),z.number(),z.boolean()]);
const sortNo=z.union([z.string(),z.number()]).nullish();
const name=z.object({Value:z.string()});
const envelope=z.object({msg:z.literal('OK'),data:z.object({DemoAccount:z.boolean().optional(),ContentErrors:z.array(z.string()).optional(),GeneralInfo:z.object({IcecatId:z.union([z.string(),z.number()]),Title:z.string(),Brand:z.string(),BrandPartCode:z.string(),Category:z.object({CategoryID:z.union([z.string(),z.number()]).optional(),Name:name})}),FeaturesGroups:z.array(z.object({SortNo:sortNo,FeatureGroup:z.object({Name:name}),Features:z.array(z.object({SortNo:sortNo,PresentationValue:z.string().nullish(),RawValue:value.nullable().optional(),Value:value.nullable().optional(),Feature:z.object({ID:z.union([z.string(),z.number()]),Name:name,Measure:z.object({Signs:z.object({_:z.string()}).optional()}).optional()})}))}))})});
export class IcecatError extends Error { constructor(message:string,public readonly pause=false){super(message);} }
export const icecatReferenceSchema=z.union([z.strictObject({icecatId:z.string().regex(/^[1-9]\d{0,14}$/)}),z.strictObject({brand:z.string().trim().min(1).max(150),productCode:z.string().trim().min(1).max(200)}),z.strictObject({gtin:z.string().regex(/^\d{8,14}$/)})]);
export type IcecatReference=z.infer<typeof icecatReferenceSchema>;
export function icecatConfigured(env:Record<string,string|undefined>=process.env){return env.ICECAT_ENABLED==='true'&&!!env.ICECAT_API_TOKEN?.trim()&&!/[\r\n]/.test(env.ICECAT_API_TOKEN);}
async function readJSON(response:Response) {
 const reader=response.body?.getReader();if(!reader)throw new IcecatError('Resposta Icecat vazia.');
 const chunks:Uint8Array[]=[];let bytes=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2_000_000){await reader.cancel();throw new IcecatError('Ficha acima do limite de importação.');}chunks.push(value);}}catch(error){if(error instanceof IcecatError)throw error;throw new IcecatError('Resposta Icecat interrompida. Nenhum dado foi salvo.');}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{throw new IcecatError('Resposta Icecat inválida.');}
}
function failure(status:number,body:unknown) {
 const parsed=z.object({StatusCode:z.number().int()}).safeParse(body);
 const code=parsed.success?parsed.data.StatusCode:null;
 if(code===18||code===19)return new IcecatError('API token inválido ou revogado. Confira se foi usado o API token, e não o content token.',true);
 if(code===9||code===12||status===401||status===403)return new IcecatError('Token sem acesso à ficha ou produto fora da assinatura. Nenhum upgrade foi realizado.');
 if(code===14||code===15)return new IcecatError('Ficha restrita pela marca ou ainda não liberada. Nenhum dado foi salvo.');
 if(code===8||code===17)return new IcecatError('Ficha não encontrada para o identificador informado.');
 return new IcecatError(status===429?'Limite do Icecat atingido; consulta interrompida sem repetição.':'A consulta Icecat falhou. Nenhum dado foi salvo.',status===429||status>=500);
}

export function normalizeIcecat(input:unknown,kind:HardwareKind,now=new Date().toISOString(),license:'open'|'unconfirmed'='open') {
 const result=envelope.safeParse(input);if(!result.success)throw new IcecatError('Resposta Icecat inválida ou sem ficha disponível.');
 const data=result.data.data,info=data.GeneralInfo;
 if(data.DemoAccount)throw new IcecatError('Conta de demonstração não pode alimentar o catálogo. Configure sua conta Open Icecat.');
 if(data.ContentErrors?.length)throw new IcecatError('A resposta não contém todas as seções solicitadas.');
 const category=info.Category.Name.Value.toLowerCase();
 const accepted={phone:/^(smartphones?|mobile phones?|tablets?)$/,cpu:/^processors?$/,ram:/^(internal )?memory( modules)?$/};
 const categoryIds={phone:['1893','119','897'],cpu:['989'],ram:['911']};
 if(!accepted[kind].test(category)||(info.Category.CategoryID!==undefined&&!categoryIds[kind].includes(String(info.Category.CategoryID))))throw new IcecatError('A categoria da ficha não corresponde ao comparador escolhido.');
 const providerId=String(info.IcecatId);if(!/^\d+$/.test(providerId))throw new IcecatError('Identificador Icecat inválido.');
 const source={publisher:'Icecat / '+info.Brand,url:`https://live.icecat.biz/api?lang=EN&icecat_id=${providerId}`,accessedAt:now,license:license==='open'?'Open Icecat Open Content License':'PREENCHER: licença de republicação Icecat',licenseUrl:license==='open'?'https://iceclog.com/open-content-license/':'https://iceclog.com/content-license-icecat/'};
 // Documentation: descending SortNo, general Feature.ID and Measure.Signs._.
 const order=(a:{SortNo?:string|number|null},b:{SortNo?:string|number|null})=>(Number(b.SortNo)||0)-(Number(a.SortNo)||0);
 const nonempty=(v:string|number|boolean|null|undefined)=>typeof v==='string'?v.trim()||null:v??null;
 const specs=[...data.FeaturesGroups].sort(order).flatMap(group=>[...group.Features].sort(order).map(feature=>({
  key:`icecat-${feature.Feature.ID}`,group:group.FeatureGroup.Name.Value,label:feature.Feature.Name.Value,
  value:nonempty(feature.RawValue)??nonempty(feature.Value),
  displayValue:feature.PresentationValue?.trim()||null,
  unit:feature.Feature.Measure?.Signs?._??'',source,
 })));

 return hardwareSchema.parse({schemaVersion:1,syncVersion:2,...(kind==='phone'?{deviceType:/^tablets?$/.test(category)?'tablet':'phone'}:{}),id:`icecat-${kind}-${providerId}`,kind,name:info.Title,brand:info.Brand,modelCode:info.BrandPartCode,variant:'PREENCHER: região e configuração exata ou composição do kit',status:'draft',createdAt:now,updatedAt:now,reviewedAt:null,reviewer:null,demonstration:false,source,specifications:specs,benchmarks:[],limitations:['Importação documental em inglês; conferir a variante e as especificações antes de publicar.','A API de especificações não comprova desempenho real nem oferece preço atual de loja.']});
}
export async function fetchIcecatReference(reference:IcecatReference,kind:HardwareKind,env:Record<string,string|undefined>=process.env,fetcher:typeof fetch=fetch,mediaRoot?:string) {
 if(env.ICECAT_ENABLED!=='true')throw new IcecatError('Importação desativada. Configure ICECAT_ENABLED=true quando o token estiver pronto.');
 const token=env.ICECAT_API_TOKEN?.trim();
 if(!token || /[\r\n]/.test(token))throw new IcecatError('Configure um ICECAT_API_TOKEN válido no ambiente privado do servidor.');
 const checked=icecatReferenceSchema.safeParse(reference);if(!checked.success)throw new IcecatError('Informe um ID numérico, GTIN ou marca e código válidos.');
 const url=new URL('https://live.icecat.biz/api');url.searchParams.set('lang','EN');if('icecatId' in checked.data)url.searchParams.set('icecat_id',checked.data.icecatId);else if('gtin' in checked.data)url.searchParams.set('GTIN',checked.data.gtin);else{url.searchParams.set('Brand',checked.data.brand);url.searchParams.set('ProductCode',checked.data.productCode);}url.searchParams.set('content',kind==='phone'?'generalinfo,featuregroups,image,gallery':'generalinfo,featuregroups');
 // Both tokens remain server-only; remote signed image URLs are never persisted.
 // No shopname/app key fallback, retries, upgrades or billing changes.
 let response:Response;
 try{response=await fetcher(url,{headers:{Accept:'application/json','api-token':token,...(env.ICECAT_CONTENT_TOKEN?.trim()&&!/[\r\n]/.test(env.ICECAT_CONTENT_TOKEN)?{'content-token':env.ICECAT_CONTENT_TOKEN.trim()}:{})},signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});}catch{throw new IcecatError('Não foi possível consultar o Icecat. Tente novamente mais tarde.');}
 if(!response.ok){let errorBody:unknown=null;try{errorBody=await readJSON(response);}catch{/* Ignore arbitrary error text; only documented numeric codes are exposed. */}throw failure(response.status,errorBody);}
 const parsed=await readJSON(response);
 const normalized=normalizeIcecat(parsed,kind,new Date().toISOString(),'unconfirmed');
 if([token,env.ICECAT_CONTENT_TOKEN?.trim()].filter(Boolean).some(secret=>JSON.stringify(normalized).includes(secret!)))throw new IcecatError('Resposta Icecat contém informação privada e foi recusada.');if('icecatId' in checked.data&&normalized.id!==`icecat-${kind}-${checked.data.icecatId}`)throw new IcecatError('A API devolveu outro identificador. Nenhum dado foi salvo.');
 if(mediaRoot&&kind==='phone')normalized.image=await importIcecatImage(parsed,mediaRoot,normalized.name,fetcher);
 return normalized;
}

export async function fetchIcecat(icecatId:string,kind:HardwareKind,env:Record<string,string|undefined>=process.env,fetcher:typeof fetch=fetch){return fetchIcecatReference({icecatId},kind,env,fetcher);}
