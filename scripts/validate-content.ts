import { validateEditorial } from '../src/lib/editorial';
import { loadHardware } from '../src/lib/hardware';
import { loadPhones } from '../src/lib/phones';
import { loadPCs } from '../src/lib/pcs';
import { loadContent } from '../src/lib/content';
try {
  const data = await loadContent();
  await validateEditorial(process.cwd(), data);
  await loadPCs();
  await loadPhones();
  await loadHardware();
  console.log(`Conteúdo válido: ${data.products.length} produtos, ${data.articles.length} artigos. Aprovação editorial não é concedida por este check.`);
} catch (error) {
  console.error('Falha na validação de conteúdo. Corrija os campos indicados antes do build.');
  if (error instanceof Error) console.error(error.message);
  process.exitCode = 1;
}
