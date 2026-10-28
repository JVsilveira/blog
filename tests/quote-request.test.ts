import { describe, expect, it } from "vitest";
import {
  quoteSuggestionEndpoint,
  quoteSuggestionError,
} from "../src/features/quotes/quote-request";

describe("requisição de sugestão do orçamento", () => {
  it("usa a mesma origem do SilfonTech por padrão", () => {
    expect(quoteSuggestionEndpoint).toBe("/api/quotes/suggest");
  });

  it("traduz falhas de rede e tempo limite sem mostrar Failed to fetch", () => {
    expect(quoteSuggestionError(new TypeError("Failed to fetch"))).toContain(
      "conectar",
    );
    expect(
      quoteSuggestionError(new DOMException("timed out", "TimeoutError")),
    ).toContain("tempo");
  });

  it("preserva mensagens explicativas devolvidas pelo servidor", () => {
    expect(quoteSuggestionError(new Error("Limite diário atingido."))).toBe(
      "Limite diário atingido.",
    );
  });
});
