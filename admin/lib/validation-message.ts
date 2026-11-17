import type { ZodError } from 'zod';
const labels:Record<string,string>={slug:'Endereço da postagem: use letras minúsculas sem acentos, números e hífens',title:'Título',description:'Resumo',authorId:'Autor',category:'Categoria',featuredOrder:'Ordem de destaque',tags:'Tags',sourceIds:'Fontes',methodology:'Método e evidências',limitations:'Limitações',body:'Conteúdo',translations:'Traduções',approved:'Confirmação de revisão'};
export function validationMessage(error:ZodError){
 return [...new Set(error.issues.slice(0,5).map(issue=>{
  const key=issue.path.find(part=>typeof part==='string'&&labels[part]);
  return `${key?labels[String(key)]:'Dados editoriais'}: ${issue.code==='too_big'?'o valor ultrapassa o limite permitido':issue.code==='too_small'?'preencha o campo obrigatório':issue.code==='invalid_format'?'formato inválido':issue.code==='custom'?issue.message:'confira o valor informado'}.`;
 }))].join(' ');
}
