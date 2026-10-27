import { jsPDF } from "jspdf";
import {
  quoteSchema,
  reviewErrors,
  totals,
  brl,
  type Quote,
} from "../../domain/quotes/model";
import { citySizes, serviceTypes } from "../../domain/quotes/estimate";
let font: Promise<string> | undefined;
async function loadFont() {
  font ??= fetch("/fonts/NotoSans-Regular.ttf", { credentials: "omit" })
    .then(async (response) => {
      if (!response.ok)
        throw Error("Não foi possível carregar a fonte do PDF.");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let raw = "";
      for (const byte of bytes) raw += String.fromCharCode(byte);
      return btoa(raw);
    })
    .catch((error) => {
      font = undefined;
      throw error;
    });
  return font;
}
export async function createQuotePDF(input: Quote, fontBase64?: string) {
  const q = quoteSchema.parse(input);
  const errors = reviewErrors(q);
  if (errors.length) throw Error(errors[0]);
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });
  const encoded = fontBase64 ?? (await loadFont());
  pdf.addFileToVFS("NotoSans.ttf", encoded);
  pdf.addFont("NotoSans.ttf", "NotoSans", "normal");
  pdf.addFont("NotoSans.ttf", "NotoSans", "bold");
  pdf.setProperties({
    title: `Orçamento ${q.documentNumber}`,
    author: q.provider.name,
    subject: "Proposta de serviços de TI",
    creator: "SilfonTech",
  });
  let y = 22;
  const width = 174,
    lineHeight = 5;
  function next() {
    pdf.addPage();
    y = 22;
  }
  function text(value: string, size = 10, bold = false) {
    pdf.setFont("NotoSans", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(24, 35, 53);
    const lines = pdf.splitTextToSize(
      value.normalize("NFC"),
      width,
    ) as string[];
    for (const line of lines) {
      if (y > 273) next();
      pdf.text(line, 18, y);
      y += lineHeight;
    }
    y += 2;
  }
  function heading(title: string) {
    if (y > 255) next();
    y += 5;
    pdf.setDrawColor(210, 222, 240);
    pdf.line(18, y - 4, 192, y - 4);
    text(title, 12, true);
  }
  text("ORÇAMENTO DE SERVIÇOS DE TI", 18, true);
  text(
    `${q.documentNumber} | Revisão ${q.revision} | ${new Date(q.updatedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
  );
  heading("Prestador");
  text(
    [
      q.provider.name,
      q.provider.contact,
      q.provider.identification,
      q.provider.address,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  heading("Cliente");
  text(
    [
      q.customer.name,
      q.customer.contact,
      q.customer.identification,
      q.customer.address,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  heading("Atendimento");
  text(
    [
      `Modalidade: ${q.serviceContext.modality}`,
      q.serviceContext.locality &&
        `Cidade/localidade: ${q.serviceContext.locality}`,
      q.serviceContext.citySize &&
        `Porte: ${citySizes[q.serviceContext.citySize]}`,
      q.serviceContext.serviceType &&
        `Categoria: ${serviceTypes[q.serviceContext.serviceType]}`,
      q.serviceContext.equipment &&
        `Equipamento: ${q.serviceContext.equipment}`,
      q.serviceContext.report && `Solicitação: ${q.serviceContext.report}`,
      q.serviceContext.notes && `Observações: ${q.serviceContext.notes}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const sum = totals(q);
  heading("Serviços e valores");
  for (const [index, item] of q.items.entries()) {
    if (y > 242) next();
    text(`${index + 1}. ${item.description}`, 11, true);
    text(
      `Quantidade: ${(item.quantityMillis / 1000).toLocaleString("pt-BR")} ${item.unit} | Unitário: ${brl(item.unitPriceCents)} | Total: ${brl(sum.lines[index] ?? 0)}`,
    );
    if (item.note) text(item.note);
    text(`Base do valor: ${item.estimateSource}`, 9);
  }
  heading("Resumo financeiro");
  text(
    `Subtotal: ${brl(sum.subtotal)}\nDesconto: ${brl(sum.discount)}\nAcréscimos: ${brl(sum.additional)}${q.additionalCharges.description ? " — " + q.additionalCharges.description : ""}`,
  );
  text(`Total da proposta: ${brl(sum.total)}`, 15, true);
  heading("Condições da proposta");
  for (const [key, label] of Object.entries({
    deadline: "Prazo de execução",
    validity: "Validade",
    payment: "Pagamento",
    exclusions: "Não incluído",
    diagnosis: "Diagnóstico e dependências",
    professional: "Condições adicionais",
  })) {
    const value = q.terms[key as keyof Quote["terms"]];
    if (value) text(`${label}: ${value}`);
  }
  if (q.pricing) {
    heading("Premissas do atendimento");
    text(q.pricing.assumptions);
  }
  heading("Aceite do cliente");
  text(
    "A execução depende da aprovação do cliente e da confirmação do escopo, dos valores e das condições pelo profissional. Alterações devem ser acordadas antes de executar serviços adicionais.",
  );
  text(
    "\nAprovado por: ____________________________________\nData: ____ / ____ / ________",
  );
  text(
    "Valores definidos pelo profissional e sujeitos ao escopo e às condições desta proposta. Orçamento não é nota fiscal nem laudo.",
    9,
  );
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(80, 95, 115);
    pdf.text(
      `${q.documentNumber.slice(0, 50)} | Página ${i} de ${pages}`,
      18,
      287,
    );
  }
  return pdf;
}
export async function downloadQuotePDF(q: Quote) {
  (await createQuotePDF(q)).save(
    `orcamento-${q.documentNumber.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60)}.pdf`,
  );
}
