import type { Product } from '../schemas';
import { selectionSchema, slots, type Selection, type Slot } from './contracts';
const slotLabels:Record<Slot,string>={cpu:'Processador',motherboard:'Placa-mãe',ram:'Memória RAM',gpu:'Placa de vídeo',storage:'Armazenamento',psu:'Fonte',case:'Gabinete',cooler:'Cooler'};
export type CheckStatus = 'pass'|'fail'|'unknown'|'not-applicable';
export type Finding = {ruleId:string;status:CheckStatus;severity:'blocking'|'warning';componentIds:string[];message:string;sourceIds:string[]};
export const statusLabels = {pass:'Compatível nos critérios verificados',fail:'Incompatibilidade encontrada',unknown:'Precisa de verificação','not-applicable':'Não se aplica'};
export function resolveSelection(input:unknown, products:Product[]) {
  const parsed=selectionSchema.safeParse(input);
  if (!parsed.success) return {ok:false as const, message:'Configuração inválida ou versão não suportada. Revise a seleção.'};
  const missing=slots.filter(slot => parsed.data.components[slot] && !products.some(p => p.id===parsed.data.components[slot] && p.category===slot && p.status!=='archived'));
  if(missing.length) return {ok:false as const,message:`Peça removida ou categoria inválida: ${missing.map(s=>slotLabels[s]).join(', ')}. Revise sem substituir automaticamente.`};
  return {ok:true as const,selection:parsed.data};
}
export function evaluateBuild(selection:Selection, products:Product[], margin=0.3) {
  if(!Number.isFinite(margin)||margin<0.2||margin>1) throw new Error('Margem deve estar entre 20% e 100%.');
  const findings:Finding[]=[];
  const get=<C extends Slot>(slot:C) => products.find(p=>p.id===selection.components[slot] && p.specs.category===slot)?.specs as Extract<Product['specs'],{category:C}>|undefined;
  const add=(ruleId:string, involved:Slot[], condition:boolean|null, message:string, na=false, warning=false) => {
    const ps=involved.flatMap(slot=>products.filter(p=>p.id===selection.components[slot]));
    const sourceIds=[...new Set(ps.flatMap(p=>p.sourceIds))];
    findings.push({ruleId,status:na?'not-applicable':condition===null || (condition && (!sourceIds.length || ps.some(p=>!p.sourceIds.length || p.verificationStatus!=='approved' || !p.verifiedAt)))?'unknown':condition?'pass':'fail',severity:warning?'warning':'blocking',componentIds:ps.map(p=>p.id),message,sourceIds});
  };
  const eq=(a:unknown,b:unknown):boolean|null=>a==null||b==null?null:a===b;
  const fits=(a:number|null|undefined,b:number|null|undefined):boolean|null=>a==null||b==null?null:a<=b;
  const includes=(list:string[]|null|undefined,item:string|null|undefined):boolean|null=>list==null||item==null?null:list.includes(item);
  const c=get('cpu'), b=get('motherboard'), r=get('ram'), g=get('gpu'), k=get('case'), h=get('cooler'), p=get('psu'), d=get('storage');
  for(const slot of slots) if(!['gpu','cooler'].includes(slot)) add(`required-${slot}`,[slot],get(slot)?true:null,`${slotLabels[slot]}: peça obrigatória precisa estar selecionada e documentada.`);
  const resolved=resolveSelection(selection,products); if(!resolved.ok) add('selection',[],false,resolved.message);
  add('socket',['cpu','motherboard'],eq(c?.socket,b?.socket),'O soquete da CPU deve corresponder ao da placa-mãe.');
  const support=b?.cpuSupport?.find(s=>s.cpuId===selection.components.cpu);
  add('cpu-support',['cpu','motherboard'],!c||!b||b.cpuSupport===null?null:!!support,'A matriz do fabricante deve listar esta CPU; soquete igual não basta.');
  add('bios',['cpu','motherboard'],support && b?.installedBios && b.biosVerifiedCpuIds!==null ? b.biosVerifiedCpuIds.includes(selection.components.cpu!) : null,`BIOS instalada deve ter suporte documental à CPU. BIOS mínima: ${support?.minimumBios ?? 'não informada'}.`);
  if(support) findings[findings.length-1]!.sourceIds.push(...support.sourceIds);
  add('ram-type',['ram','motherboard'],eq(r?.type,b?.memoryType),'O tipo DDR da RAM deve corresponder ao da placa-mãe.');
  add('cpu-memory',['cpu','ram'],includes(c?.memoryTypes,r?.type),'A CPU deve suportar o tipo de memória.');
  add('ram-format',['ram','motherboard'],eq(r?.formFactor,b?.memoryFormFactor),'O formato físico dos módulos deve corresponder ao slot.');
  add('ram-capacity',['ram','motherboard'],fits(r?.kitCount!=null&&r.moduleCapacityGB!=null?r.kitCount*r.moduleCapacityGB:null,b?.maxMemoryGB),'A capacidade considera todos os módulos do kit.');
  add('ram-slots',['ram','motherboard'],fits(r?.kitCount,b?.slotsMemory),'Cada módulo do kit ocupa um slot de memória.');
  add('memory-profile',['ram'],r?.profileSupport?.some(v=>v==='XMP'||v==='EXPO')?null:r?.profileSupport?.includes('JEDEC')?true:null,'XMP/EXPO e clocks elevados são condicionais; não há garantia de frequência.',false,true);
  add('board-case',['motherboard','case'],includes(k?.supportedBoardFormats,b?.formFactor),'O gabinete deve suportar o formato da placa-mãe.');
  const gpuSelected=selection.components.gpu!==null;
  add('gpu-length',['gpu','case'],fits(g?.lengthMm,k?.gpuClearanceMm),'Comprimento da GPU deve caber no espaço útil.',!gpuSelected);
  add('gpu-thickness',['gpu','case'],fits(g?.thicknessSlots,k?.gpuClearanceSlots),'A espessura da GPU deve caber nos slots do gabinete.',!gpuSelected);
  add('gpu-slot',['gpu','motherboard'],b?.pcieSlots==null?null:b.pcieSlots>=1,'A GPU exige slot PCIe disponível.',!gpuSelected);
  add('geometry',['case'],k?.geometryVerified??null,'Geometria com radiadores, cabos e peças instaladas exige verificação.');
  const coolerSelected=selection.components.cooler!==null;
  add('cooler-socket',['cooler','cpu'],includes(h?.supportedSockets,c?.socket),'O cooler deve suportar o soquete.',!coolerSelected);
  add('cooler-height',['cooler','case'],fits(h?.heightMm,k?.coolerClearanceMm),'A altura do cooler deve caber no gabinete.',!coolerSelected);
  add('cooler-kit',['cooler'],h?.mountingKitVerified??null,'Confirmar kit de montagem e sua disponibilidade.',!coolerSelected);
  add('cooling',['cpu','cooler'],coolerSelected?!!h:c?.coolerIncluded??null,'Sem cooler separado, é necessário confirmar cooler incluído e adequação térmica documental.');
  // Cooler incluído sem envelope térmico/geometria documentado não aprova o conjunto.
  add('included-cooler',['cpu','case'],null,'Cooler incluído exige conferência de altura, montagem e envelope térmico.',coolerSelected);
  add('psu-format',['psu','case'],includes(k?.psuFormats,p?.formFactor),'O gabinete deve suportar o formato da fonte.');
  const required:Record<string,number>={}; let known=!!b?.powerConnectors && (!gpuSelected||!!g?.requiredPowerConnectors);
  for(const connectors of [b?.powerConnectors,gpuSelected?g?.requiredPowerConnectors:{}]) if(connectors) for(const [name,count] of Object.entries(connectors)) required[name]=(required[name]??0)+count;
  if(!p?.connectors) known=false;
  add('power-connectors',['motherboard','gpu','psu'],known?Object.entries(required).every(([name,count])=>(p!.connectors![name]??0)>=count):null,'Conectores nativos somados por tipo e quantidade. Adaptadores não são presumidos.');
  add('psu-evidence',['psu'],p?p.specificationSourceIds.length>0:null,'Potência contínua e conectores exigem fonte documental; watts e 80 PLUS não atestam qualidade elétrica.');
  add('storage-interface',['storage','motherboard'],includes(b?.storageInterfaces,d?.interface),'A interface do armazenamento deve ser suportada.');
  add('storage-slot',['storage','motherboard'],!d||!b||b.storageSlots===null||d.slotRequirements===null||d.interface===null||d.formFactor===null?null:b.storageSlots.some(s=>s.available===true&&s.interface===d.interface&&s.formFactors.includes(d.formFactor!)&&d.slotRequirements!.includes(s.id))?true:b.storageSlots.some(s=>s.available===null)?null:false,'É necessário um slot livre que satisfaça interface, formato e requisitos; ocupação não é ignorada.');
  add('lanes',['storage','motherboard','gpu'],b?.lanesVerified??null,'Compartilhamento de lanes/portas precisa ser conferido para a seleção.');
  add('video',['cpu','motherboard','gpu'],gpuSelected?g?.videoOutputs==null?null:g.videoOutputs.length>0:c?.integratedGraphics===false?false:c?.integratedGraphics===true?b?.videoOutputs==null?null:b.videoOutputs.length>0:null,'Sem GPU dedicada, CPU precisa de vídeo integrado e saída adequada na placa-mãe; monitor e cabo devem ser conferidos.');
  const watts=[c?.powerEstimateW,gpuSelected?g?.powerEstimateW:0,coolerSelected?h?.powerEstimateW:0];
  const estimatedPowerW=watts.every(v=>v!=null)?Math.ceil((watts.reduce<number>((sum,v)=>sum+(v??0),0)+100)*(1+margin)):undefined;
  add('power-capacity',['cpu','gpu','cooler','psu'],estimatedPowerW===undefined||p?.continuousPowerW==null?null:estimatedPowerW<=p.continuousPowerW,`Estimativa: CPU + GPU + cooler + reserva de 100 W para placa, RAM, uma unidade e ventoinhas, com margem de ${Math.round(margin*100)}%. Não é medição nem recomendação de fonte; TDP não basta.`);
  const status:CheckStatus=findings.some(f=>f.status==='fail')?'fail':findings.some(f=>f.status==='unknown')?'unknown':'pass';
  return {findings,status,...(estimatedPowerW===undefined?{}:{estimatedPowerW})};
}
