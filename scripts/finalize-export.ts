import { rm } from 'node:fs/promises';
// Next 16 exige pelo menos um parâmetro. Essas entradas executam notFound(),
// mas o export ainda gera HTML 404 servido como 200 por um host simples.
// Remove apenas os caminhos reservados; nenhuma fixture é injetada.
for (const route of ['out/en/articles/sem-publicacao','out/es/articles/sem-publicacao','out/publicacoes/sem-publicacao','out/celulares/sem-publicacao', 'out/pcs/configuracoes/sem-publicacao', 'out/recomendacoes/sem-publicacao', 'out/ajuda/sem-publicacao', 'out/ajuda/categoria/sem-publicacao', 'out/ajuda/pagina/0']) {
  await rm(route, {recursive:true, force:true});
}
