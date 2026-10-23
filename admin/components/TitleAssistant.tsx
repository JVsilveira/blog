"use client";
import { useEffect, useRef, useState } from "react";

type ArticleContext = {
  kind?: "blog"|"news"|"opinion";
  title: string;
  description: string;
  category: string;
  methodology: string;
  limitations: string;
  body: string;
};
export function TitleAssistant({ article, csrf, disabled, unavailableReason, onApply, onPendingChange }: {
  article: ArticleContext;
  csrf: string;
  disabled: boolean;
  unavailableReason: string;
  onApply: (title: string) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const previous = useRef<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  const snapshot = JSON.stringify(article);
  const latest = useRef(snapshot);
  useEffect(() => { latest.current = snapshot; }, [snapshot]);
  useEffect(() => () => { controller.current?.abort(); onPendingChange(false); }, [onPendingChange]);
  async function suggest() {
    if (controller.current || unavailableReason || disabled) return;
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    onPendingChange(true);
    setMessage("");
    try {
      const response = await fetch("/api/title", {
        method: "POST", signal: request.signal,
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ ...article, previous: previous.current.slice(-20) }),
      });
      const result = await response.json() as {title?: string; error?: string};
      if (!response.ok) throw new Error(result.error || "Não foi possível sugerir um título.");
      if (typeof result.title !== "string" || !result.title.trim()) throw new Error("A IA não retornou um título válido.");
      if (request.signal.aborted) return;
      if (latest.current !== snapshot) {
        setMessage("Você alterou a postagem durante a geração. Clique novamente para sugerir com o texto atual.");
        return;
      }
      previous.current = [...previous.current, result.title].slice(-20);
      onApply(result.title);
      setMessage("Título sugerido. Você pode editar, apagar ou clicar novamente para gerar outro.");
    } catch (error) {
      if (!request.signal.aborted) setMessage(error instanceof Error ? error.message : "Não foi possível sugerir um título.");
    } finally {
      if (!request.signal.aborted) setLoading(false);
      controller.current = null;
      onPendingChange(false);
    }
  }
  return (
    <div className="title-assistant" aria-busy={loading}>
      <button type="button" disabled={!!unavailableReason || disabled || loading || article.body.trim().length < 80} onClick={() => void suggest()}>
        {loading ? "Sugerindo título…" : "Sugerir título com IA"}
      </button>
      <p className="muted">{unavailableReason || (article.body.trim().length < 80 ? "Escreva pelo menos 80 caracteres de conteúdo para sugerir um título." : "Seu texto será enviado ao Gemini. Você pode editar o título ou pedir outra alternativa.")}</p>
      <p className="title-assistant-feedback" role="status">{message}</p>
    </div>
  );
}
