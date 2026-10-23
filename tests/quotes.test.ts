import { describe, it, expect } from "vitest";
import {
  blankQuote,
  blankItem,
  decimal,
  importQuote,
  totals,
  reviewErrors,
} from "../src/domain/quotes/model";
import {
  readQuotes,
  writeQuotes,
  withDocument,
} from "../src/features/quotes/storage";
function quote() {
  const q = blankQuote();
  q.items = [{ ...blankItem(), unitPriceCents: 10001, quantityMillis: 1500 }];
  return q;
}
describe("orçamentos locais", () => {
  it("snapshot emitido é imutável e revisão mantém o anterior", () => {
    const q = { ...quote(), status: "issued" as const };
    expect(withDocument([q], q)).toEqual([q]);
    expect(() =>
      withDocument([q], { ...q, documentNumber: "alterado" }),
    ).toThrow();
    expect(
      withDocument([q], { ...q, status: "draft", revision: 2 }),
    ).toHaveLength(2);
  });
  it("zero e fração 1,5, arredondamento por linha", () => {
    expect(totals(blankQuote()).total).toBe(0);
    expect(totals(quote()).total).toBe(15002);
    const q = quote();
    q.items = [
      { ...blankItem(), unitPriceCents: 1, quantityMillis: 500 },
      { ...blankItem(), unitPriceCents: 1, quantityMillis: 500 },
    ];
    expect(totals(q).total).toBe(2);
  });
  it("descontos exclusivos, limites e acréscimo posterior", () => {
    const q = quote();
    q.discount = { kind: "percent", value: 1000 };
    expect(totals(q).total).toBe(13502);
    q.discount = { kind: "fixed", value: 20000 };
    q.additionalCharges.amountCents = 300;
    expect(totals(q).total).toBe(300);
  });
  it("converte decimal sem arredondamento binário", () => {
    expect(decimal("1,5", 3)).toBe(1500);
    expect(decimal("10.01", 2)).toBe(1001);
    for (const bad of ["-1", "1e3", "", "Infinity", "0.001"])
      expect(() => decimal(bad, 2)).toThrow();
  });
  it("revisão vazia mantém requisitos explícitos", () => {
    expect(reviewErrors(blankQuote()).length).toBeGreaterThan(3);
  });
  it("roundtrip e rejeição de negativos, extremos e versão", () => {
    const q = quote();
    expect(importQuote(JSON.stringify(q))).toEqual(q);
    for (const patch of [
      { schemaVersion: 2 },
      { currency: "USD" },
      { unexpected: true },
      { items: [{ ...q.items[0], unitPriceCents: -1 }] },
      { items: [{ ...q.items[0], quantityMillis: 1_000_001 }] },
      { documentNumber: "a".repeat(161) },
    ])
      expect(() => importQuote(JSON.stringify({ ...q, ...patch }))).toThrow();
  });
  it("import malicioso, HTML, prototype e tamanho", () => {
    const q = quote();
    for (const raw of [
      "{",
      JSON.stringify({ ...q, documentNumber: "<img onerror=alert(1)>" }),
      JSON.stringify(q).replace(
        '"schemaVersion":1',
        '"__proto__":{},"schemaVersion":1',
      ),
      " ".repeat(512001),
    ])
      expect(() => importQuote(raw)).toThrow();
    q.items.push(q.items[0]!);
    expect(() => importQuote(JSON.stringify(q))).toThrow();
  });
  it("storage bloqueado/quota não remove dados; corrupção preservada", () => {
    expect(() =>
      readQuotes({
        getItem() {
          throw Error("SecurityError");
        },
      }),
    ).toThrow();
    expect(() =>
      writeQuotes(
        {
          setItem() {
            throw Error("QuotaExceededError");
          },
        },
        [quote()],
      ),
    ).toThrow();
    expect(() => readQuotes({ getItem: () => "{corrompido" })).toThrow();
  });
  it("storage válido, limite e 40 itens longos", () => {
    let raw = "";
    const storage = {
      getItem: () => raw || null,
      setItem: (_k: string, v: string) => {
        raw = v;
      },
    };
    const q = quote();
    q.items = Array.from({ length: 40 }, () => ({
      ...blankItem(),
      description: "Serviço com acentos — manutenção ".repeat(4),
      unitPriceCents: 100,
      quantityMillis: 1500,
    }));
    writeQuotes(storage, [q]);
    expect(readQuotes(storage)[0]).toEqual(q);
    expect(totals(q).total).toBe(6000);
    expect(() =>
      writeQuotes(storage, Array.from({ length: 21 }, quote)),
    ).toThrow();
  });
});
