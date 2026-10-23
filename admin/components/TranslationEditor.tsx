"use client";
import type { Article } from '../../src/domain/schemas';
export type TranslationDraft = NonNullable<Article['translations']>[number] & {approved?:boolean};
export function TranslationEditor({translations,onChange}:{translations:TranslationDraft[];onChange:(value:TranslationDraft[])=>void}) {
 function update(language:'en'|'es',patch:Partial<TranslationDraft>) {
  onChange(translations.map(t=>t.language===language ? {...t,...patch,approved:patch.approved ?? false}:t));
 }
 return <section className="translation-editor">
  <h2>Versões internacionais</h2>
  <p>Traduza o conteúdo completo e revise antes de aprovar. Alterações no original exigem nova revisão das traduções.</p>
  {(['en','es'] as const).map(language=> {
   const item=translations.find(t=>t.language===language);
   const label=language==='en'?'inglês':'espanhol';
   return <details className="resource-form" key={language}>
    <summary>Tradução em {label}{item?.status==='published'?' — revisão registrada':' — rascunho'}</summary>
    {item ? <div>
      {(['title','description','body','methodology','limitations'] as const).map((key,index)=><label className="field" key={key}>
        <span>{['Título','Resumo','Conteúdo em Markdown','Método e evidências','Limitações'][index]} em {label}</span>
        <textarea value={item[key]} rows={key==='body'?12:2} maxLength={key==='body'?200000:key==='title'?300:key==='description'?1000:5000} onChange={e=>update(language,{[key]:e.target.value})}/>
      </label>)}
      <label className="check"><input type="checkbox" checked={item.approved ?? false} onChange={e=>update(language,{approved:e.target.checked})}/>Conferi a tradução completa em {label} e aprovo sua publicação junto ao original.</label>
      <button type="button" onClick={()=>onChange(translations.filter(t=>t.language!==language))}>Remover tradução em {label}</button>
    </div> : <button type="button" onClick={()=>onChange([...translations,{language,status:'draft',title:'',description:'',body:'',methodology:'',limitations:'',sourceUpdatedAt:null,reviewedAt:null,approved:false}])}>Adicionar tradução em {label}</button>}
   </details>;
  })}
 </section>;
}
