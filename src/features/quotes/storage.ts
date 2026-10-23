import {brand} from "../../config/brand";
import { importQuote, type Quote } from "../../domain/quotes/model";
export const STORAGE_KEY = `${brand.slug}:quotes:v1`;
export const LEGACY_STORAGE_KEY = "portal-tech:quotes:v1";
export function clearQuotes(storage:Pick<Storage,"removeItem">){storage.removeItem(LEGACY_STORAGE_KEY);storage.removeItem(STORAGE_KEY);}
export function readQuotes(storage: Pick<Storage, "getItem">): Quote[] {
  const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return [];
  if (raw.length > 6_000_000)
    throw Error(
      "Armazenamento local excede o limite. Exporte seus documentos.",
    );
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || data.length > 20)
    throw Error("Lista local incompatível; nada foi apagado.");
  return data.map((q) => importQuote(JSON.stringify(q)));
}
export function writeQuotes(
  storage: Pick<Storage, "setItem">,
  quotes: Quote[],
) {
  if (quotes.length > 20)
    throw Error("Limite de 20 documentos. Exporte e remova um documento.");
  quotes.forEach((q) => importQuote(JSON.stringify(q)));
  storage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// Snapshots emitidos só podem ser removidos por exclusão explícita, nunca regravados.
export function withDocument(previous: Quote[], doc: Quote): Quote[] {
  const snapshot = previous.find(
    (p) =>
      p.id === doc.id && p.revision === doc.revision && p.status === "issued",
  );
  if (
    doc.status === "issued" &&
    snapshot &&
    JSON.stringify(snapshot) !== JSON.stringify(doc)
  )
    throw Error(
      "Snapshot existente difere do documento. Duplique para criar outro orçamento.",
    );
  return [
    ...previous.filter(
      (p) =>
        p.id !== doc.id ||
        p.revision !== doc.revision ||
        p.status !== doc.status,
    ),
    doc,
  ];
}
