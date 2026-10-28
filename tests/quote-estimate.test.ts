import { it, expect, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { estimateInput, matchedEstimate } from "../src/domain/quotes/estimate";
import {
  blankQuote,
  blankItem,
  importQuote,
  totals,
} from "../src/domain/quotes/model";
import { suggestQuote } from "../cloud-admin/src/quote-ai";
import {
  createQuotePDF,
  quoteAttendanceLines,
} from "../src/features/quotes/pdf";
import type { Env } from "../cloud-admin/src/types";
it("não aceita dados de cliente, descrições com contatos, preços negativos ou IDs desalinhados", () => {
  const id = crypto.randomUUID(),
    input = {
      citySize: "small",
      modality: "remota",
      serviceType: "software",
      services: [
        { id, description: "Configuração de backup e atualização do sistema" },
      ],
    };
  expect(estimateInput.parse(input)).toEqual(input);
  expect(
    estimateInput.safeParse({ ...input, customer: { name: "cliente" } })
      .success,
  ).toBe(false);
  expect(
    estimateInput.safeParse({
      ...input,
      services: [{ id, description: "Configurar para cliente@example.org" }],
    }).success,
  ).toBe(false);
  for (const patch of [
    { id: crypto.randomUUID(), suggestedCents: 100 },
    { id, suggestedCents: -1 },
  ])
    expect(() =>
      matchedEstimate(
        {
          items: [{ ...patch, reason: "Estimativa" }],
          assumptions: "Conferir diagnóstico",
        },
        estimateInput.parse(input),
      ),
    ).toThrow();
});
it("preserva importações v1 e dados da sugestão sem mudar cálculo em centavos", () => {
  const q = blankQuote();
  expect(importQuote(JSON.stringify(q))).toEqual(q);
  const id = crypto.randomUUID();
  q.items = [
    { ...blankItem(), id, unitPriceCents: 10001, quantityMillis: 1500 },
  ];
  q.serviceContext.citySize = "tiny";
  q.serviceContext.serviceType = "both";
  q.pricing = {
    items: [{ id, suggestedCents: 10001, reason: "Estimativa técnica" }],
    assumptions: "Sem peças",
    model: "gemini-3.5-flash-lite",
    suggestedAt: new Date().toISOString(),
  };
  expect(importQuote(JSON.stringify(q)).pricing).toEqual(q.pricing);
  expect(totals(q).total).toBe(15002);
});
it("usa o porte da cidade na estimativa sem exibi-lo no orçamento do cliente", () => {
  const q = blankQuote();
  q.serviceContext.citySize = "tiny";
  q.serviceContext.locality = "Pelotas / RS";
  q.serviceContext.serviceType = "software";
  const lines = quoteAttendanceLines(q).join("\n");
  expect(lines).toContain("Pelotas / RS");
  expect(lines).not.toContain("Porte");
  expect(lines).not.toContain("20 mil");
});
it("cota global bloqueia chamadas externas antes de atingir uso ilimitado", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const env = {
    QUOTE_AI_ENABLED: "true",
    GEMINI_API_KEY: "fake",
    DB: {
      prepare: () => ({ bind: () => ({ first: async () => ({ count: 31 }) }) }),
    },
  } as unknown as Env;
  try {
    await expect(
      suggestQuote(
        {
          citySize: "large",
          modality: "remota",
          serviceType: "software",
          services: [
            {
              id: crypto.randomUUID(),
              description: "Instalação e configuração de aplicativo",
            },
          ],
        },
        env,
        "test-ip",
      ),
    ).rejects.toMatchObject({ status: 429 });
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
it("gera PDF A4 paginado com texto acentuado e orçamento extenso sem servidor", async () => {
  const q = blankQuote();
  q.documentNumber = "TI-TESTE";
  q.provider.name = "João Técnico";
  q.provider.contact = "Contato local";
  q.customer.name = "Cliente de teste";
  q.items = Array.from({ length: 40 }, (_, n) => ({
    ...blankItem(),
    description: `Serviço ${n + 1}: manutenção e configuração`,
    unit: "serviço",
    unitPriceCents: 10000,
    note: "Descrição técnica detalhada com acentuação. ".repeat(30),
    estimateSource: "Profissional",
  }));
  q.terms.payment = "Pagamento após conclusão";
  const font = (await readFile("public/fonts/NotoSans-Regular.ttf")).toString(
      "base64",
    ),
    pdf = await createQuotePDF(q, font);
  expect(pdf.getNumberOfPages()).toBeGreaterThan(3);
  expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
  expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
  expect(pdf.output().startsWith("%PDF-")).toBe(true);
});
it("usa redirect manual compatível com Workers e recusa redirecionar a chave Gemini", async () => {
  const id = crypto.randomUUID(),
    fetcher = vi.fn(async (_url: unknown, init: RequestInit) => {
      expect(init.redirect).toBe("manual");
      return new Response(null, {
        status: 302,
        headers: { Location: "https://outro.example/" },
      });
    });
  vi.stubGlobal("fetch", fetcher);
  const env = {
    QUOTE_AI_ENABLED: "true",
    GEMINI_API_KEY: "fake",
    DB: {
      prepare: () => ({ bind: () => ({ first: async () => ({ count: 1 }) }) }),
    },
  } as unknown as Env;
  try {
    await expect(
      suggestQuote(
        {
          citySize: "tiny",
          modality: "presencial",
          serviceType: "hardware",
          services: [{ id, description: "Limpeza e manutenção de notebook" }],
        },
        env,
        "test",
      ),
    ).rejects.toMatchObject({ status: 502 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    vi.unstubAllGlobals();
  }
});
