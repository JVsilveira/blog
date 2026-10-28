export const quoteSuggestionEndpoint =
  process.env.NEXT_PUBLIC_QUOTE_API_URL ||
  "https://api.silfontech.com.br/api/quotes/suggest";

export function quoteSuggestionError(error: unknown) {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "O tempo de análise foi excedido. Tente novamente ou preencha os valores manualmente.";
  }
  if (error instanceof TypeError) {
    return "Não foi possível conectar ao serviço de sugestões. Confira sua conexão e tente novamente; seus valores foram mantidos.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível sugerir os valores. Continue manualmente.";
}
