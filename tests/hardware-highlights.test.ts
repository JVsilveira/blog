import {expect,it} from 'vitest';
import {comparisonHighlights,highlightValue} from '../src/domain/hardware/highlights';
import {hardwareLocale} from '../src/features/hardware/i18n';
import {hardwareFixture,hardwareSource} from './fixtures/hardware';
import type {Specification} from '../src/domain/hardware/contracts';
const spec=(label:string,value:Specification['value'],unit='',key=label):Specification=>({key,label,group:'Technical details',value,unit,source:hardwareSource});
it('reduz a ficha a campos úteis, agrupa e alinha nomes alternativos sem depender da ordem ou ID da API',()=>{
 const [a,b]=hardwareFixture('phone');a!.specifications=[spec('Battery capacity',5000,'mAh'),spec('Internal memory',8,'GB'),spec('Package weight',300,'g'),...Array.from({length:100},(_,i)=>spec('Irrelevant detail '+i,'x'))];b!.specifications=[spec('RAM capacity',12,'GB'),spec('Rear camera resolution (numeric)',50,'MP')];
 const rows=comparisonHighlights([a!,b!],'pt');expect(rows.map(r=>r.label)).toEqual(['Capacidade da bateria','Câmera traseira','Memória RAM']);expect(rows.find(r=>r.id==='ram')?.values.map(s=>s?.value)).toEqual([8,12]);expect(highlightValue(rows[0]!.values[1],'pt')).toBe('Não confirmado');
});
it('preserva desconhecidos e false no filtro; diferenças de unidade não viram igualdade',()=>{
 const [a,b]=hardwareFixture('phone');a!.specifications=[spec('Battery capacity',5000,'mAh'),spec('NFC',false),spec('Wireless charging',null)];b!.specifications=[spec('Battery capacity',5000,'Wh'),spec('NFC',false),spec('Wireless charging',null)];expect(comparisonHighlights([a!,b!],'pt',true).map(r=>r.id)).toEqual(['battery','wireless-charge']);expect(highlightValue(a!.specifications[1],'es')).toBe('No');
});
it('traduz rótulos e valores simples, preserva códigos técnicos e não duplica unidades',()=>{
 const [a,b]=hardwareFixture('phone');a!.specifications=[spec('Display diagonal',6.5,'"'),spec('Rear camera type','Triple camera'),spec('Processor model','ABC-123')];b!.specifications=[];
 expect(comparisonHighlights([a!,b!],'es').find(r=>r.id==='display-size')?.label).toBe('Tamaño de pantalla');expect(highlightValue(a!.specifications[0],'pt')).toBe('6,5 ″');expect(highlightValue({...a!.specifications[0]!,displayValue:'6.5"'},'pt')).toBe('6.5"');expect(highlightValue(a!.specifications[1],'pt')).toBe('Três câmeras');expect(highlightValue(a!.specifications[2],'es')).toBe('ABC-123');expect(highlightValue(undefined,'en')).toBe('Not confirmed');
});
it('distingue RAM, CPU e campos móveis mantendo especificações pertinentes',()=>{
 const [a,b]=hardwareFixture('ram');a!.specifications=[spec('Memory clock speed',3200,'MHz'),spec('CAS latency',16),spec('Internal storage capacity',128,'GB')];b!.specifications=[];expect(comparisonHighlights([a!,b!],'en').map(r=>r.id)).toEqual(['memory-speed','latency']);
});
it('idioma explícito prevalece, navegador usa português, inglês ou espanhol e demais idiomas caem em português',()=>{
 expect(hardwareLocale('es',['en-US'])).toBe('es');expect(hardwareLocale(null,['en-GB'])).toBe('en');expect(hardwareLocale(null,['es-AR'])).toBe('es');expect(hardwareLocale(null,['de-DE'])).toBe('pt');expect(hardwareLocale(null,['pt-BR'],'/en/')).toBe('en');expect(hardwareLocale('invalid',['pt-BR'])).toBe('pt');
});
