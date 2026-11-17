import {it,expect} from 'vitest';
import {hardwareAssetPayload,hardwareSummarySchema} from '../src/domain/hardware/feed';
it('aceita arquivos e pacotes já publicados e extrai somente a ficha selecionada',()=>{
 const base={id:'icecat-ram-123',kind:'ram',name:'Fixture',brand:'Teste',modelCode:'T',variant:'T'};
 const asset='/data/hardware/pack-01234567890123456789.json#icecat-ram-123';
 expect(hardwareSummarySchema.safeParse({...base,asset}).success).toBe(true);
 expect(hardwareSummarySchema.safeParse({...base,asset:'/data/hardware/icecat-ram-123-abc.json'}).success).toBe(true);
 expect(hardwareAssetPayload({'icecat-ram-123':base},asset)).toEqual(base);
 expect(()=>hardwareAssetPayload({},asset)).toThrow();
 expect(hardwareSummarySchema.safeParse({...base,asset:'https://outside.invalid/x.json'}).success).toBe(false);
});
