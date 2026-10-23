import type { Metadata } from "next";
import { QuoteTool } from "../../../../features/quotes/QuoteTool";
export const metadata: Metadata = {
  title: "Orçamentos de TI",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="quote-page" id="conteudo" tabIndex={-1}>
      <h1>Orçamentos de TI</h1>
      <QuoteTool />
    </main>
  );
}
