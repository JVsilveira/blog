import type { Product } from "../../domain/schemas";
// Resumo público: a mesma fronteira editorial do repositório deve ser preservada.
export function ProductSummary({ product }: { product: Product }) {
  if (
    product.status !== "published" ||
    product.editorialStatus !== "published" ||
    product.verificationStatus !== "approved"
  )
    return null;
  return (
    <section className="panel" aria-label={`Resumo de ${product.name}`}>
      <h3>{product.name}</h3>
      <p>{product.brand}</p>
      {product.verifiedAt && (
        <p>
          Dados verificados em{" "}
          <time dateTime={product.verifiedAt}>
            {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
              new Date(product.verifiedAt),
            )}
          </time>
          .
        </p>
      )}
      <p>
        Este resumo identifica o produto; uma orientação de compra exige
        contexto e limitações editoriais.
      </p>
    </section>
  );
}
