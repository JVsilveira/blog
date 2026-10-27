import { z } from "zod";
export const citySizes = {
  tiny: "Muito pequena · até 20 mil habitantes",
  small: "Pequena · 20 a 100 mil habitantes",
  medium: "Média · 100 a 500 mil habitantes",
  large: "Grande · mais de 500 mil habitantes",
} as const;
export const serviceTypes = {
  hardware: "Hardware",
  software: "Software",
  both: "Hardware e software",
} as const;
export const citySizeSchema = z.enum(["tiny", "small", "medium", "large"]);
export const serviceTypeSchema = z.enum(["hardware", "software", "both"]);
const technicalText = z
  .string()
  .trim()
  .min(8, "Descreva o serviço com pelo menos 8 caracteres.")
  .max(160)
  .refine((value) => !/[<>\u0000-\u001f]/.test(value), "Use somente texto.")
  .refine(
    (value) =>
      !/@|(?:\d[ .()+/-]*){10,}|\b(?:senha|password|token)\s*[:=]/i.test(value),
    "Remova e-mails, telefones, documentos e credenciais da descrição.",
  );
export const estimateInput = z
  .strictObject({
    citySize: citySizeSchema,
    modality: z.enum(["remota", "presencial"]),
    serviceType: serviceTypeSchema,
    services: z
      .array(
        z.strictObject({ id: z.string().uuid(), description: technicalText }),
      )
      .min(1)
      .max(10),
  })
  .refine(
    (data) =>
      new Set(data.services.map((s) => s.id)).size === data.services.length,
    "Serviços duplicados.",
  );
const reason = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((v) => !/[<>\u0000-\u0008]/.test(v));
export const estimateOutput = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: z.string().uuid(),
        suggestedCents: z.number().int().min(1).max(10_000_000),
        reason,
      }),
    )
    .min(1)
    .max(10),
  assumptions: reason,
});
export type EstimateInput = z.infer<typeof estimateInput>;
export type Estimate = z.infer<typeof estimateOutput>;
export function matchedEstimate(raw: unknown, input: EstimateInput) {
  const result = estimateOutput.parse(raw);
  if (
    result.items.length !== input.services.length ||
    new Set(result.items.map((s) => s.id)).size !== input.services.length ||
    result.items.some((s) => !input.services.some((i) => i.id === s.id))
  )
    throw Error("A sugestão não corresponde aos serviços enviados.");
  return result;
}
