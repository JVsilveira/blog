import {brand} from '../../config/brand';
import {isLocale,type Locale} from './i18n';
export const languageStorageKey=`${brand.slug}-language`;
export const languagePreferenceEvent=languageStorageKey;
const legacyLanguageStorageKey='portal-language';
export function readLanguagePreference(storage:Pick<Storage,'getItem'>):Locale|null{
 const saved=storage.getItem(languageStorageKey)??storage.getItem(legacyLanguageStorageKey);
 return saved&&isLocale(saved)?saved:null;
}
export function writeLanguagePreference(storage:Pick<Storage,'setItem'>,locale:Locale){storage.setItem(languageStorageKey,locale);}
