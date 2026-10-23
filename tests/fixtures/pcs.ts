import { fixture } from './catalog';
import type { Product } from '../../src/domain/schemas';
import type { Configuration } from '../../src/domain/pc/contracts';
// Componentes inteiramente sintéticos. Nunca importar no build público.
export function pcFixture(){
  const catalog=fixture(),template=catalog.products[0]!;
  const specs:Product['specs'][]=[
    {category:'cpu',socket:'S',powerEstimateW:90,integratedGraphics:true,memoryTypes:['DDR5'],coolerIncluded:false},
    {category:'motherboard',socket:'S',chipset:'C',formFactor:'ATX',memoryType:'DDR5',memoryFormFactor:'DIMM',maxMemoryGB:128,slotsMemory:4,storageInterfaces:['NVMe'],storageSlots:[{id:'m2-1',interface:'NVMe',formFactors:['2280'],available:true}],pcieSlots:1,powerConnectors:{ATX:1,EPS:1},videoOutputs:['HDMI'],cpuSupport:[{cpuId:'cpu-test',minimumBios:'1',sourceIds:['source-test']}],installedBios:'1',biosVerifiedCpuIds:['cpu-test'],lanesVerified:true},
    {category:'ram',type:'DDR5',kitCount:2,moduleCapacityGB:16,formFactor:'DIMM',speedMTs:4800,profileSupport:['JEDEC']},
    {category:'gpu',lengthMm:200,thicknessSlots:2,powerEstimateW:120,requiredPowerConnectors:{PCIE8:1},videoOutputs:['HDMI']},
    {category:'storage',interface:'NVMe',formFactor:'2280',capacityGB:1000,slotRequirements:['m2-1']},
    {category:'psu',continuousPowerW:650,formFactor:'ATX',connectors:{ATX:1,EPS:1,PCIE8:1},specificationSourceIds:['source-test']},
    {category:'case',supportedBoardFormats:['ATX'],gpuClearanceMm:300,gpuClearanceSlots:3,coolerClearanceMm:160,psuFormats:['ATX'],radiatorRestrictions:'Sem radiador nesta fixture',geometryVerified:true},
    {category:'cooler',supportedSockets:['S'],heightMm:140,mountingKitRequirement:'Kit sintético',mountingKitVerified:true,powerEstimateW:5},
  ];
  const products=specs.map(s=>({...template,id:`${s.category}-test`,slug:`${s.category}-test`,category:s.category,specs:s,name:`${s.category} sintético`})) as Product[];
  const components=Object.fromEntries(products.map(p=>[p.category,p.id])) as Configuration['selection']['components'];
  const configuration:Configuration={id:'pc-test',schemaVersion:1,slug:'pc-test',status:'published',createdAt:template.createdAt,updatedAt:template.updatedAt,title:'Configuração sintética de teste',use:'study',summary:'Apenas fixture; não é recomendação real.',limitations:['Sem teste físico; fixture sintética.'],method:'editorial',ownerApprovedAt:template.ownerApprovedAt,sourceIds:['source-test'],selection:{schemaVersion:1,components},reasons:Object.fromEntries(products.map(p=>[p.id,'Motivo sintético para teste.'])),alternatives:[]};
  return {products,configuration,sources:catalog.sources};
}
