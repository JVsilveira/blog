import { fixture } from './catalog';
import { fields, type Phone } from '../../src/domain/phones/contracts';
export function phoneFixture() {
  const catalog=fixture();catalog.articles=[];catalog.offers=[];
  const base=catalog.products[0]!;
  catalog.products=[{...base,id:'phone-test',slug:'phone-test',name:'Aparelho sintético',category:'phone',specs:{category:'phone'}}];
  catalog.sources[0]!.scope=Object.keys(fields);
  const phone:Phone={schemaVersion:1,id:'variant-test',slug:'variant-test',status:'published',createdAt:base.createdAt,updatedAt:base.updatedAt,verifiedAt:base.verifiedAt,ownerApprovedAt:base.ownerApprovedAt,productId:'phone-test',manufacturerModelCode:'SINT-128',region:'Região de teste',ramGB:8,storageGB:128,chipset:null,screen:null,dimensions:null,weightG:180,batteryMah:null,chargingW:null,chargerIncluded:false,cameras:[{lens:'Principal sintética',megapixels:12,ois:null}],connectivity:{nfc:false,esim:null,networkBands:null},ipRating:null,operatingSystemAtLaunch:null,updatePolicy:{sourceId:'source-test',announcedYears:2,securityEndDate:'2025-01-01',verifiedAt:base.updatedAt},sourceIds:Object.fromEntries(Object.keys(fields).map(k=>[k,['source-test']])),offerIds:[],editorial:{method:'documental',summary:'Resumo sintético exclusivo para teste.',bestFor:['Uso sintético documentado'],limitations:['Não representa aparelho real ou ensaio de autonomia.'],sourceIds:['source-test'],ownerApprovedAt:base.ownerApprovedAt}};
  return {catalog,variants:[phone,{...structuredClone(phone),id:'variant-second',slug:'variant-second',storageGB:256,manufacturerModelCode:'SINT-256',weightG:190}]};
}
