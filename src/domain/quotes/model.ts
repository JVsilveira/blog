import { z } from "zod";
import {citySizeSchema,serviceTypeSchema,estimateOutput} from "./estimate";
const text = z
  .string()
  .max(2000)
  .refine(
    (s) => !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s),
    "Não use HTML ou caracteres de controle",
  );
const short = text.pipe(z.string().max(160));
const money = z.number().int().min(0).max(100_000_000);
const person = z.strictObject({
  name: short,
  contact: short,
  identification: short,
  address: text,
});
export const itemSchema = z.strictObject({
  id: z.string().uuid(),
  kind: z.enum(["serviço", "peça", "deslocamento", "outro"]),
  description: short,
  quantityMillis: z.number().int().min(1).max(1_000_000),
  unit: short,
  unitPriceCents: money,
  note: text,
  estimateSource: short,
});
export const quoteSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: z.string().uuid(),
    documentNumber: short,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    status: z.enum(["draft", "issued"]),
    revision: z.number().int().min(1).max(10000),
    provider: person,
    customer: person,
    serviceContext: z.strictObject({
      citySize: citySizeSchema.optional(),
      serviceType: serviceTypeSchema.optional(),
      equipment: short,
      report: text,
      notes: text,
      modality: z.enum(["remota", "presencial"]),
      locality: short,
      estimatedHours: short,
      serialNumber: short,
    }),
    items: z.array(itemSchema).max(40),
    discount: z.discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("fixed"), value: money }),
      z.strictObject({
        kind: z.literal("percent"),
        value: z.number().int().min(0).max(10000),
      }),
    ]),
    additionalCharges: z.strictObject({
      description: short,
      amountCents: money,
    }),
    terms: z.strictObject({
      deadline: text,
      validity: text,
      payment: text,
      exclusions: text,
      diagnosis: text,
      professional: text,
    }),
    pricing: estimateOutput.extend({model:z.literal("gemini-3.5-flash-lite"),suggestedAt:z.iso.datetime()}).optional(),
    currency: z.literal("BRL"),
  })
  .refine(
    (q) => new Set(q.items.map((i) => i.id)).size === q.items.length,
    "IDs de itens duplicados",
  );
export type Quote = z.infer<typeof quoteSchema>;
export type Item = z.infer<typeof itemSchema>;
export const MAX_BYTES = 512_000;
export function blankQuote(): Quote {
  const now = new Date().toISOString();
  const person = () => ({
    name: "",
    contact: "",
    identification: "",
    address: "",
  });
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    documentNumber: "",
    createdAt: now,
    updatedAt: now,
    status: "draft",
    revision: 1,
    provider: person(),
    customer: person(),
    serviceContext: {
      equipment: "",
      report: "",
      notes: "",
      modality: "remota",
      locality: "",
      estimatedHours: "",
      serialNumber: "",
    },
    items: [],
    discount: { kind: "fixed", value: 0 },
    additionalCharges: { description: "", amountCents: 0 },
    terms: {
      deadline: "",
      validity: "",
      payment: "",
      exclusions: "",
      diagnosis: "",
      professional: "",
    },
    currency: "BRL",
  };
}
export function blankItem(): Item {
  return {
    id: crypto.randomUUID(),
    kind: "serviço",
    description: "",
    quantityMillis: 1000,
    unit: "",
    unitPriceCents: 0,
    note: "",
    estimateSource: "",
  };
}
export function decimal(value: string, digits: number): number {
  if (!new RegExp(`^\\d+(?:[.,]\\d{1,${digits}})?$`).test(value))
    throw Error(`Use número positivo com até ${digits} casas decimais.`);
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const n = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, "0"));
  if (!Number.isSafeInteger(n)) throw Error("Número muito grande.");
  return n;
}
export function totals(quote: Quote) {
  const q = quote;
  const lines = q.items.map((i) =>
    Number(
      (BigInt(i.unitPriceCents) * BigInt(i.quantityMillis) + 500n) / 1000n,
    ),
  );
  const subtotal = lines.reduce((a, b) => a + b, 0);
  const requested =
    q.discount.kind === "fixed"
      ? q.discount.value
      : Number((BigInt(subtotal) * BigInt(q.discount.value) + 5000n) / 10000n);
  const discount = Math.min(subtotal, requested);
  return {
    lines,
    subtotal,
    discount,
    additional: q.additionalCharges.amountCents,
    total: subtotal - discount + q.additionalCharges.amountCents,
  };
}
export function importQuote(raw: string): Quote {
  if (new TextEncoder().encode(raw).length > MAX_BYTES)
    throw Error("Arquivo excede 512 KB.");
  const result = quoteSchema.safeParse(JSON.parse(raw));
  if (!result.success)
    throw Error(
      "JSON incompatível: confira versão 1, campos, limites e ausência de HTML.",
    );
  return result.data;
}
export function reviewErrors(q: Quote): string[] {
  const errors: string[] = [];
  if (!q.documentNumber.trim()) errors.push("Informe o número do orçamento.");
  if (!q.provider.name.trim()) errors.push("Informe o nome do prestador.");
  if (!q.provider.contact.trim())
    errors.push("Informe o contato do prestador.");
  if (!q.customer.name.trim()) errors.push("Informe o nome do cliente.");
  if (!q.items.length) errors.push("Adicione ao menos um item.");
  q.items.forEach((i, n) => {
    if (!i.description.trim() || !i.unit.trim() || !i.estimateSource.trim())
      errors.push(
        `Item ${n + 1}: informe descrição, unidade e origem da estimativa.`,
      );
  });
  if (
    q.additionalCharges.amountCents &&
    !q.additionalCharges.description.trim()
  )
    errors.push("Descreva o acréscimo.");
  return errors;
}
export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
