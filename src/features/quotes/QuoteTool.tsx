"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  blankItem,
  blankQuote,
  brl,
  totals,
  reviewErrors,
  quoteSchema,
  type Quote,
} from "../../domain/quotes/model";
import {
  citySizes,
  serviceTypes,
  estimateInput,
  matchedEstimate,
  type Estimate,
} from "../../domain/quotes/estimate";
import { readQuotes, writeQuotes, withDocument } from "./storage";
import { Field, NumberField } from "./QuoteFields";
import styles from "./quotes.module.css";
const Advanced = dynamic(
  () => import("./AdvancedQuoteTool").then((m) => m.AdvancedQuoteTool),
  { ssr: false },
);
const steps = ["Atendimento", "Valores", "Cliente e condições", "Revisão"];
const api =
  process.env.NEXT_PUBLIC_QUOTE_API_URL ||
  "https://silfontech-admin.devsilveira.workers.dev/api/quotes/suggest";
function initialQuote() {
  const q = blankQuote();
  return {
    ...q,
    documentNumber: `TI-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${q.id.slice(0, 4).toUpperCase()}`,
    items: [
      {
        ...blankItem(),
        unit: "serviço",
        estimateSource: "Valor definido pelo profissional",
      },
    ],
    terms: {
      ...q.terms,
      exclusions:
        "Peças, licenças e deslocamento não estão incluídos, salvo quando discriminados nesta proposta.",
      diagnosis:
        "Escopo e prazo sujeitos à confirmação após diagnóstico. Qualquer serviço adicional depende de aprovação do cliente.",
    },
  };
}
export function QuoteTool() {
  const [q, setQ] = useState<Quote>(initialQuote),
    [step, setStep] = useState(0),
    [advanced, setAdvanced] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [suggestion, setSuggestion] = useState<Estimate | null>(null),
    [saved, setSaved] = useState<Quote[]>([]);
  const form = useRef<HTMLFormElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    generation = useRef(0);
  const sum = totals(q);
  function change(update: (old: Quote) => Quote) {
    generation.current++;
    setQ((old) => ({
      ...update(old),
      status: "draft",
      revision: old.status === "issued" ? old.revision + 1 : old.revision,
      updatedAt: new Date().toISOString(),
    }));
    setMessage("");
  }
  function contextChange(update: (old: Quote) => Quote) {
    change((old) => ({ ...update(old), pricing: undefined }));
    setSuggestion(null);
  }
  function move(next: number) {
    setStep(next);
    setMessage("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function validContext() {
    if (q.items.some((i) => i.kind !== "serviço")) {
      setMessage(
        "Este documento inclui peças ou outros itens. Use o editor avançado para preservar esse detalhamento.",
      );
      return false;
    }
    try {
      estimateInput.parse({
        citySize: q.serviceContext.citySize,
        modality: q.serviceContext.modality,
        serviceType: q.serviceContext.serviceType,
        services: q.items.map((i) => ({
          id: i.id,
          description: i.description,
        })),
      });
      return true;
    } catch {
      setMessage(
        "Selecione porte da cidade e tipo de serviço. Descreva de 1 a 10 serviços, com 8 a 160 caracteres cada, sem dados pessoais ou credenciais.",
      );
      return false;
    }
  }
  async function suggest() {
    if (!validContext() || busy) return;
    setBusy(true);
    setMessage("Analisando os serviços…");
    const version = ++generation.current;
    try {
      const input = estimateInput.parse({
        citySize: q.serviceContext.citySize,
        modality: q.serviceContext.modality,
        serviceType: q.serviceContext.serviceType,
        services: q.items.map((i) => ({
          id: i.id,
          description: i.description,
        })),
      });
      const response = await fetch(api, {
        method: "POST",
        credentials: "omit",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(35000),
      });
      const body = await response.json();
      if (!response.ok)
        throw Error(body.error || "Não foi possível obter a sugestão.");
      const result = matchedEstimate(body, input);
      if (generation.current !== version) {
        setMessage(
          "O orçamento mudou durante a análise. Os valores foram mantidos; solicite outra sugestão.",
        );
        return;
      }
      change((old) => ({
        ...old,
        pricing: {
          ...result,
          model: "gemini-3.5-flash-lite",
          suggestedAt: new Date().toISOString(),
        },
        items: old.items.map((item) => ({
          ...item,
          unitPriceCents: result.items.find((i) => i.id === item.id)!
            .suggestedCents,
          estimateSource: "Estimativa Gemini, revisável pelo profissional",
        })),
      }));
      setSuggestion(result);
      move(1);
      setMessage(
        "Sugestões aplicadas. Confira cada valor e ajuste como preferir.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível sugerir os valores. Continue manualmente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function pdf() {
    if (!form.current?.reportValidity()) return;
    const errors = reviewErrors(q);
    if (errors.length) {
      setMessage(errors.join(" "));
      return;
    }
    setBusy(true);
    try {
      const { downloadQuotePDF } = await import("./pdf");
      await downloadQuotePDF(q);
      setMessage("PDF gerado neste dispositivo.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o PDF.",
      );
    } finally {
      setBusy(false);
    }
  }
  function save() {
    const invalid = Array.from(
      form.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input,textarea",
      ) ?? [],
    ).find((el) => !el.validity.valid && !el.validity.valueMissing);
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    try {
      const next = withDocument(readQuotes(localStorage), quoteSchema.parse(q));
      writeQuotes(localStorage, next);
      setSaved(next);
      setMessage("Orçamento salvo somente neste dispositivo.");
    } catch {
      setMessage(
        "Não foi possível salvar: armazenamento cheio, bloqueado ou corrompido. Nada foi apagado.",
      );
    }
  }
  function updateItem(id: string, patch: Partial<Quote["items"][number]>) {
    change((old) => ({
      ...old,
      items: old.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }
  if (advanced)
    return (
      <Advanced
        initialQuote={q}
        onBack={(doc) => {
          generation.current++;
          setQ(doc);
          setSuggestion(null);
          setAdvanced(false);
          setStep(0);
        }}
      />
    );
  return (
    <div className={styles.tool}>
      <p className={styles.lead}>
        Descreva o atendimento, ajuste os valores e prepare uma proposta para o
        seu cliente.
      </p>
      <nav aria-label="Etapas do orçamento" className={styles.steps}>
        {steps.map((label, n) => (
          <span key={label} aria-current={step === n ? "step" : undefined}>
            <b>{n + 1}</b>
            {label}
          </span>
        ))}
      </nav>
      <div className={styles.layout}>
        <form
          ref={form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.current?.reportValidity()) return;
            if (step === 0) {
              if (validContext()) move(1);
            } else if (step === 2) {
              const errors = reviewErrors(q);
              if (errors.length) setMessage(errors.join(" "));
              else move(3);
            } else move(Math.min(3, step + 1));
          }}
        >
          <h2 ref={heading} tabIndex={-1}>
            {steps[step]}
          </h2>
          {step === 0 && (
            <fieldset disabled={busy} className={styles.simpleFieldset}>
              <label>
                Porte da cidade do atendimento
                <select
                  required
                  value={q.serviceContext.citySize ?? ""}
                  onChange={(e) =>
                    contextChange((old) => ({
                      ...old,
                      serviceContext: {
                        ...old.serviceContext,
                        citySize: e.target.value as NonNullable<
                          Quote["serviceContext"]["citySize"]
                        >,
                      },
                    }))
                  }
                >
                  <option value="" disabled>
                    Selecione o tamanho da cidade
                  </option>
                  {Object.entries(citySizes).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.numbers}>
                <label>
                  Modalidade
                  <select
                    value={q.serviceContext.modality}
                    onChange={(e) =>
                      contextChange((old) => ({
                        ...old,
                        serviceContext: {
                          ...old.serviceContext,
                          modality: e.target.value as "remota" | "presencial",
                        },
                      }))
                    }
                  >
                    <option value="presencial">Presencial</option>
                    <option value="remota">Remoto</option>
                  </select>
                </label>
                <label>
                  Tipo de serviço
                  <select
                    required
                    value={q.serviceContext.serviceType ?? ""}
                    onChange={(e) =>
                      contextChange((old) => ({
                        ...old,
                        serviceContext: {
                          ...old.serviceContext,
                          serviceType: e.target.value as NonNullable<
                            Quote["serviceContext"]["serviceType"]
                          >,
                        },
                      }))
                    }
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {Object.entries(serviceTypes).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <h3>O que será feito?</h3>
              <p className={styles.hint}>
                Descreva o trabalho e sua complexidade. Não inclua nomes,
                telefones, documentos ou senhas.
              </p>
              {q.items.map((item, n) => (
                <div key={item.id} className={styles.serviceEntry}>
                  <label>
                    Serviço {n + 1}
                    <textarea
                      required
                      minLength={8}
                      maxLength={160}
                      value={item.description}
                      placeholder="Ex.: limpeza interna de notebook, troca de pasta térmica e teste de temperatura"
                      onChange={(e) =>
                        contextChange((old) => ({
                          ...old,
                          items: old.items.map((i) =>
                            i.id === item.id
                              ? { ...i, description: e.target.value }
                              : i,
                          ),
                        }))
                      }
                    />
                  </label>
                  {q.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        contextChange((old) => ({
                          ...old,
                          items: old.items.filter((i) => i.id !== item.id),
                        }))
                      }
                    >
                      Remover serviço {n + 1}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                disabled={q.items.length >= 10}
                onClick={() =>
                  contextChange((old) => ({
                    ...old,
                    items: [
                      ...old.items,
                      {
                        ...blankItem(),
                        unit: "serviço",
                        estimateSource: "Valor definido pelo profissional",
                      },
                    ],
                  }))
                }
              >
                + Adicionar serviço
              </button>
              <div className={styles.aiBox}>
                <h3>Uma referência para começar</h3>
                <p>
                  O Gemini considera o serviço, a modalidade e o porte da
                  cidade. A sugestão não é uma pesquisa atual de preços.
                </p>
                <p className={styles.hint}>
                  Ao solicitar, somente estas descrições técnicas e opções serão
                  enviadas ao Google. No nível gratuito, o conteúdo pode ser
                  usado para melhorar os produtos do Google.
                </p>
                <button
                  className={styles.primary}
                  type="button"
                  disabled={busy}
                  onClick={() => void suggest()}
                >
                  {busy ? "Analisando…" : "Sugerir valores com IA"}
                </button>
              </div>
            </fieldset>
          )}
          {step === 1 && (
            <>
              <p>
                Você define o preço final. Altere os valores abaixo ou peça uma
                nova sugestão.
              </p>
              <fieldset disabled={busy} className={styles.simpleFieldset}>
                {q.items.map((item, n) => (
                  <div key={item.id} className={styles.priceEntry}>
                    <h3>
                      {n + 1}. {item.description}
                    </h3>
                    <div className={styles.numbers}>
                      <NumberField
                        label={`Valor unitário do serviço ${n + 1} (R$)`}
                        value={item.unitPriceCents}
                        digits={2}
                        onChange={(unitPriceCents) =>
                          updateItem(item.id, {
                            unitPriceCents,
                            estimateSource: "Valor revisado pelo profissional",
                          })
                        }
                      />
                      <NumberField
                        label={`Quantidade do serviço ${n + 1}`}
                        value={item.quantityMillis}
                        digits={3}
                        min={1}
                        max={1_000_000}
                        onChange={(quantityMillis) =>
                          updateItem(item.id, { quantityMillis })
                        }
                      />
                    </div>
                    {suggestion?.items.find((i) => i.id === item.id) && (
                      <p className={styles.hint}>
                        Sugestão:{" "}
                        {brl(
                          suggestion.items.find((i) => i.id === item.id)!
                            .suggestedCents,
                        )}{" "}
                        por execução.{" "}
                        {suggestion.items.find((i) => i.id === item.id)!.reason}
                      </p>
                    )}
                    <strong>Total do serviço: {brl(sum.lines[n] ?? 0)}</strong>
                  </div>
                ))}
                {suggestion && (
                  <p className={styles.notice}>{suggestion.assumptions}</p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void suggest()}
                >
                  {busy ? "Analisando…" : "Sugerir valores novamente"}
                </button>
                <p className={styles.hint}>
                  Uma nova sugestão substitui os valores atuais. Se preferir,
                  mantenha os seus.
                </p>
                <NumberField
                  label="Desconto (R$)"
                  value={
                    q.discount.kind === "fixed"
                      ? q.discount.value
                      : sum.discount
                  }
                  digits={2}
                  onChange={(value) =>
                    change((old) => ({
                      ...old,
                      discount: { kind: "fixed", value },
                    }))
                  }
                />
                <NumberField
                  label="Deslocamento e outros acréscimos (R$)"
                  value={q.additionalCharges.amountCents}
                  digits={2}
                  onChange={(amountCents) =>
                    change((old) => ({
                      ...old,
                      additionalCharges: {
                        ...old.additionalCharges,
                        amountCents,
                      },
                    }))
                  }
                />
                {q.additionalCharges.amountCents > 0 && (
                  <Field
                    label="Descrição dos acréscimos"
                    required
                    value={q.additionalCharges.description}
                    onChange={(description) =>
                      change((old) => ({
                        ...old,
                        additionalCharges: {
                          ...old.additionalCharges,
                          description,
                        },
                      }))
                    }
                  />
                )}
              </fieldset>
            </>
          )}
          {step === 2 && (
            <fieldset disabled={busy} className={styles.simpleFieldset}>
              <p className={styles.hint}>
                Estes dados ficam no seu dispositivo e no PDF. Eles não são
                enviados ao Gemini.
              </p>
              <Field
                label="Número do orçamento"
                required
                value={q.documentNumber}
                onChange={(documentNumber) =>
                  change((old) => ({ ...old, documentNumber }))
                }
              />
              <div className={styles.numbers}>
                <Field
                  label="Seu nome ou empresa"
                  required
                  value={q.provider.name}
                  onChange={(name) =>
                    change((old) => ({
                      ...old,
                      provider: { ...old.provider, name },
                    }))
                  }
                />
                <Field
                  label="Seu contato"
                  required
                  value={q.provider.contact}
                  onChange={(contact) =>
                    change((old) => ({
                      ...old,
                      provider: { ...old.provider, contact },
                    }))
                  }
                />
                <Field
                  label="Nome do cliente"
                  required
                  value={q.customer.name}
                  onChange={(name) =>
                    change((old) => ({
                      ...old,
                      customer: { ...old.customer, name },
                    }))
                  }
                />
              </div>
              <Field
                label="Contato do cliente (opcional)"
                value={q.customer.contact}
                onChange={(contact) =>
                  change((old) => ({
                    ...old,
                    customer: { ...old.customer, contact },
                  }))
                }
              />
              <Field
                label="Cidade / UF (opcional)"
                value={q.serviceContext.locality}
                onChange={(locality) =>
                  change((old) => ({
                    ...old,
                    serviceContext: { ...old.serviceContext, locality },
                  }))
                }
              />
              {Object.entries({
                deadline: "Prazo de execução",
                validity: "Validade da proposta",
                payment: "Condições de pagamento",
              }).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  required
                  value={q.terms[key as keyof Quote["terms"]]}
                  onChange={(value) =>
                    change((old) => ({
                      ...old,
                      terms: { ...old.terms, [key]: value },
                    }))
                  }
                />
              ))}
              <details>
                <summary>Escopo, exclusões e condições adicionais</summary>
                {Object.entries({
                  exclusions: "O que não está incluído",
                  diagnosis: "Diagnóstico e dependências",
                  professional: "Condições adicionais",
                }).map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    multiline
                    value={q.terms[key as keyof Quote["terms"]]}
                    onChange={(value) =>
                      change((old) => ({
                        ...old,
                        terms: { ...old.terms, [key]: value },
                      }))
                    }
                  />
                ))}
              </details>
            </fieldset>
          )}
          {step === 3 && (
            <section className={styles.proposal}>
              <h3>Orçamento {q.documentNumber}</h3>
              <p>
                <strong>{q.provider.name}</strong> · {q.provider.contact}
              </p>
              <p>Para: {q.customer.name}</p>
              <p>
                {q.serviceContext.modality} ·{" "}
                {q.serviceContext.serviceType
                  ? serviceTypes[q.serviceContext.serviceType]
                  : ""}
                {q.serviceContext.locality
                  ? " · " + q.serviceContext.locality
                  : ""}
              </p>
              {q.items.map((item, n) => (
                <div className={styles.previewLine} key={item.id}>
                  <span>
                    {item.description}
                    <small>
                      {item.quantityMillis / 1000} × {brl(item.unitPriceCents)}
                    </small>
                  </span>
                  <strong>{brl(sum.lines[n] ?? 0)}</strong>
                </div>
              ))}
              <p>
                Desconto: {brl(sum.discount)} · Acréscimos:{" "}
                {brl(sum.additional)}
              </p>
              <p className={styles.total}>Total: {brl(sum.total)}</p>
              {Object.entries({
                deadline: "Prazo",
                validity: "Validade",
                payment: "Pagamento",
                exclusions: "Exclusões",
                diagnosis: "Diagnóstico",
                professional: "Condições adicionais",
              }).map(
                ([key, label]) =>
                  q.terms[key as keyof Quote["terms"]] && (
                    <p key={key}>
                      <strong>{label}:</strong>{" "}
                      {q.terms[key as keyof Quote["terms"]]}
                    </p>
                  ),
              )}
              <p className={styles.hint}>
                Revise os valores e as condições antes de apresentar a proposta.
                Orçamento não é nota fiscal nem laudo.
              </p>
              <button
                className={styles.primary}
                type="button"
                disabled={busy}
                onClick={() => void pdf()}
              >
                {busy ? "Preparando PDF…" : "Baixar orçamento em PDF"}
              </button>
            </section>
          )}
          <div role="status" aria-live="polite" className={styles.notice}>
            {message}
          </div>
          <div className={styles.actions}>
            {step > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => move(step - 1)}
              >
                Voltar
              </button>
            )}
            {step < 3 && (
              <button className={styles.primary} disabled={busy} type="submit">
                {step === 0
                  ? "Continuar com valores manuais"
                  : step === 2
                    ? "Revisar orçamento"
                    : "Continuar"}
              </button>
            )}
          </div>
        </form>
        <aside className={styles.side}>
          <span>Seu orçamento</span>
          <p className={styles.total}>{brl(sum.total)}</p>
          <p>
            {q.items.length} {q.items.length === 1 ? "serviço" : "serviços"} ·{" "}
            {q.serviceContext.modality}
          </p>
          <p className={styles.hint}>
            Peças e licenças só entram se você as adicionar. O preço final é
            sempre definido por você.
          </p>
        </aside>
      </div>
      <details className={styles.local}>
        <summary>Salvar, abrir ou usar opções avançadas</summary>
        <p>
          Salvar é opcional e usa somente este navegador. Evite dispositivos
          compartilhados.
        </p>
        <button onClick={save}>Salvar neste dispositivo</button>
        <button
          onClick={() => {
            try {
              setSaved(readQuotes(localStorage));
              setMessage("Documentos locais carregados.");
            } catch {
              setMessage(
                "Armazenamento indisponível ou corrompido. Nada foi apagado.",
              );
            }
          }}
        >
          Abrir salvos
        </button>
        {saved.map((doc) => (
          <p key={`${doc.id}-${doc.revision}-${doc.status}`}>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Abrir este documento e substituir as alterações em memória?",
                  )
                ) {
                  generation.current++;
                  setQ(doc);
                  setSuggestion(null);
                  move(0);
                }
              }}
            >
              {doc.documentNumber || "Sem número"} · revisão {doc.revision}
            </button>
          </p>
        ))}
        <p>
          Importação e exportação JSON, impressão, peças, descontos percentuais
          e snapshots continuam no editor avançado.
        </p>
        <button disabled={busy} onClick={() => setAdvanced(true)}>
          Abrir editor avançado
        </button>
      </details>
    </div>
  );
}
