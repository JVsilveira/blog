import {expect,it} from 'vitest';
import {blankQuote} from '../src/domain/quotes/model';
import {readQuotes,writeQuotes,clearQuotes,STORAGE_KEY,LEGACY_STORAGE_KEY} from '../src/features/quotes/storage';
import {emptySelection,storageKey,legacyStorageKey,readStoredSelection,clearStoredSelection} from '../src/features/pc-builder/state';
import {languageStorageKey,readLanguagePreference,writeLanguagePreference} from '../src/features/publication/language-preference';
function storage(){const values=new Map<string,string>();return {values,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};}
it('orçamentos antigos continuam legíveis; novos salvamentos usam SilfonTech e limpar não ressuscita dados legados',()=>{
 const s=storage(),quote=blankQuote();s.setItem(LEGACY_STORAGE_KEY,JSON.stringify([quote]));expect(readQuotes(s)).toEqual([quote]);expect(s.getItem(STORAGE_KEY)).toBeNull();writeQuotes(s,[]);expect(readQuotes(s)).toEqual([]);expect(s.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();clearQuotes(s);expect(readQuotes(s)).toEqual([]);expect(s.values.size).toBe(0);
});
it('não mascara corrupção no novo armazenamento nem apaga o legado ao ler',()=>{const s=storage();s.setItem(LEGACY_STORAGE_KEY,JSON.stringify([blankQuote()]));s.setItem(STORAGE_KEY,'invalid');expect(()=>readQuotes(s)).toThrow();expect(s.values.size).toBe(2);});
it('seleções de PC anteriores são preservadas; a chave nova tem prioridade e a exclusão remove ambas',()=>{const s=storage(),legacy=JSON.stringify(emptySelection());s.setItem(legacyStorageKey,legacy);expect(readStoredSelection(s)).toBe(legacy);s.setItem(storageKey,'saved-new-selection');expect(readStoredSelection(s)).toBe('saved-new-selection');clearStoredSelection(s);expect(readStoredSelection(s)).toBeNull();});
it('preferência de idioma anterior é respeitada até uma escolha nova, sem gravação automática',()=>{const s=storage();s.setItem('portal-language','es');expect(readLanguagePreference(s)).toBe('es');expect(s.getItem(languageStorageKey)).toBeNull();writeLanguagePreference(s,'en');expect(readLanguagePreference(s)).toBe('en');expect(s.getItem('portal-language')).toBe('es');});
