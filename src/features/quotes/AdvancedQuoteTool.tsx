"use client";
import { analytics } from "../../lib/analytics";
import { useRef, useState } from "react";
import {
  blankItem,
  blankQuote,
  brl,
  importQuote,
  MAX_BYTES,
  quoteSchema,
  reviewErrors,
  totals,
  type Quote,
} from "../../domain/quotes/model";
import { readQuotes, writeQuotes, withDocument, clearQuotes } from "./storage";
import styles from "./quotes.module.css";
import { Field, NumberField } from "./QuoteFields";
const termLabels = {
  deadline: "Prazo estimado",
  validity: "Validade da proposta",
  payment: "Forma de pagamento",
  exclusions: "Exclusões",
  diagnosis: "Dependências de diagnóstico",
  professional: "Termos do profissional",
};
export function AdvancedQuoteTool({
  initialQuote,
  onBack,
}: {
  initialQuote: Quote;
  onBack: (quote: Quote) => void;
}) {
  const [q, setQ] = useState<Quote>(initialQuote);
  const [review, setReview] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Quote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const sum = totals(q);
  function change(update: (old: Quote) => Quote) {
    setQ((old) => ({
      ...update(old),
      pricing: undefined,
      status: "draft",
      revision: old.status === "issued" ? old.revision + 1 : old.revision,
      updatedAt: new Date().toISOString(),
    }));
    setReview(false);
    setErrors([]);
    setMessage("");
  }
  function attempt(action: () => void) {
    try {
      action();
    } catch {
      setMessage(
        "Não foi possível acessar ou salvar os dados locais: armazenamento bloqueado, cheio ou corrompido. Nada foi apagado. Você pode exportar JSON.",
      );
    }
  }
  function validFields(required = false) {
    const invalid = Array.from(
      form.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ) ?? [],
    ).filter(
      (el) =>
        !el.validity.valid &&
        (required || !el.validity.valueMissing || el.validity.customError),
    );
    return invalid;
  }
  function validate() {
    const invalid = validFields(true);
    const e = [
      ...reviewErrors(q),
      ...invalid
        .filter((el) => !el.validity.valueMissing)
        .map((el) => `${el.labels?.[0]?.textContent}: ${el.validationMessage}`),
    ];
    setErrors(e);
    if (e.length) {
      requestAnimationFrame(() => {
        (invalid[0] ?? errorRef.current)?.focus();
      });
      return false;
    }
    return true;
  }
  function validDraft() {
    const invalid = validFields();
    if (invalid.length) {
      invalid[0]?.reportValidity();
      return false;
    }
    return true;
  }
  function save(doc: Quote) {
    attempt(() => {
      const previous = readQuotes(localStorage);
      const next = withDocument(previous, doc);
      writeQuotes(localStorage, next);
      setSaved(next);
      setLoaded(true);
      setMessage(
        "Documento salvo neste dispositivo. Alterações posteriores precisam ser salvas novamente.",
      );
    });
  }
  function load(doc: Quote) {
    setLoadVersion((v) => v + 1);
    setQ(doc);
    setReview(false);
    setErrors([]);
    setMessage("Documento aberto em memória.");
  }
  function replace(action: () => void) {
    requestAnimationFrame(() =>
      document.getElementById("confirmar-acao")?.focus(),
    );
    setConfirm(() => () => {
      action();
      setConfirm(null);
    });
  }
  function exportJSON() {
    const blob = new Blob([JSON.stringify(quoteSchema.parse(q), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orcamento.json";
    a.click();
    analytics.track({ name: "quote_export", format: "json" });
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "JSON exportado. Proteja o arquivo: ele contém dados do cliente.",
    );
  }
  return (
    <div className={styles.tool}>
      <div className={styles.editor}>
        <button onClick={() => onBack(q)}>
          Voltar ao orçamento simplificado
        </button>
        <p>
          Preencha, revise e imprima. Os dados ficam em memória até você
          escolher salvar ou exportar. Proposta não é nota fiscal nem laudo.
        </p>
        <p>
          Neste modo, não há envio remoto. Preços e condições são definidos pelo
          profissional; estimativas podem depender de diagnóstico.
        </p>
        <noscript>Ative JavaScript para preencher o orçamento local.</noscript>
        <div role="status" className={styles.notice}>
          {message}
        </div>
        {confirm ? (
          <div
            className={styles.notice}
            role="group"
            aria-label="Confirmar ação"
          >
            <p>
              Confirmar esta ação? Dados em memória não salvos ou documentos
              excluídos não poderão ser recuperados. Exporte antes, se
              necessário.
            </p>
            <button id="confirmar-acao" onClick={() => confirm()}>
              Confirmar ação
            </button>{" "}
            <button onClick={() => setConfirm(null)}>Cancelar</button>
          </div>
        ) : null}
        {errors.length ? (
          <div role="alert" tabIndex={-1} ref={errorRef}>
            <h2>Revise os campos</h2>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p>Os dados foram mantidos. Volte às seções indicadas.</p>
          </div>
        ) : null}
        <form
          key={loadVersion}
          noValidate
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            if (validate()) {
              setReview(true);
              requestAnimationFrame(() =>
                document.getElementById("revisao")?.focus(),
              );
            }
          }}
        >
          <p>
            * Campos obrigatórios para revisão. Até 40 itens e 20 documentos
            locais.
          </p>
          <fieldset>
            <legend>Identificação</legend>
            <Field
              label="Número do orçamento"
              required
              value={q.documentNumber}
              onChange={(v) => change((o) => ({ ...o, documentNumber: v }))}
            />
            {(["provider", "customer"] as const).map((key) => (
              <div key={key} className={styles.group}>
                <h2>{key === "provider" ? "Prestador" : "Cliente"}</h2>
                {(
                  [
                    "name",
                    "contact",
                    ...(key === "provider" ? ["identification"] : ["address"]),
                  ] as ("name" | "contact" | "identification" | "address")[]
                ).map((f) => (
                  <Field
                    key={f}
                    label={
                      {
                        name: "Nome ou empresa",
                        contact: "Contato",
                        identification: "Identificação fiscal (opcional)",
                        address: "Endereço (somente se necessário)",
                      }[f]
                    }
                    required={
                      f === "name" || (key === "provider" && f === "contact")
                    }
                    value={q[key][f]}
                    onChange={(v) =>
                      change((o) => ({ ...o, [key]: { ...o[key], [f]: v } }))
                    }
                  />
                ))}
              </div>
            ))}
          </fieldset>
          <fieldset>
            <legend>Atendimento</legend>
            {Object.entries({
              equipment: "Tipo de equipamento",
              report: "Relato",
              notes: "Observações técnicas",
              locality: "Localidade",
              estimatedHours: "Horas estimadas",
              serialNumber: "Número de série (opcional)",
            }).map(([k, label]) => (
              <Field
                key={k}
                label={label}
                multiline={k === "report" || k === "notes"}
                value={
                  q.serviceContext[k as keyof Quote["serviceContext"]] ?? ""
                }
                onChange={(v) =>
                  change((o) => ({
                    ...o,
                    serviceContext: { ...o.serviceContext, [k]: v },
                  }))
                }
              />
            ))}
            <p>
              Registre série e endereço apenas se necessários ao atendimento.
            </p>
            <label>
              Modalidade
              <select
                value={q.serviceContext.modality}
                onChange={(e) =>
                  change((o) => ({
                    ...o,
                    serviceContext: {
                      ...o.serviceContext,
                      modality: e.target.value as "remota" | "presencial",
                    },
                  }))
                }
              >
                <option>remota</option>
                <option>presencial</option>
              </select>
            </label>
          </fieldset>
          <fieldset>
            <legend>Itens e valores</legend>
            {!q.items.length ? (
              <p>
                Nenhum item. Adicione um serviço, peça ou deslocamento com seus
                próprios valores.
              </p>
            ) : null}
            {q.items.map((item, n) => {
              const update = (patch: Partial<typeof item>) =>
                change((o) => ({
                  ...o,
                  items: o.items.map((i) =>
                    i.id === item.id ? { ...i, ...patch } : i,
                  ),
                }));
              return (
                <div className={styles.item} key={item.id}>
                  <h3>Item {n + 1}</h3>
                  <label>
                    Tipo
                    <select
                      value={item.kind}
                      onChange={(e) =>
                        update({ kind: e.target.value as typeof item.kind })
                      }
                    >
                      {["serviço", "peça", "deslocamento", "outro"].map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Descrição"
                    required
                    value={item.description}
                    onChange={(description) => update({ description })}
                  />
                  <div className={styles.numbers}>
                    <NumberField
                      label="Quantidade (até 3 casas)"
                      value={item.quantityMillis}
                      digits={3}
                      min={1}
                      max={1_000_000}
                      onChange={(quantityMillis) => update({ quantityMillis })}
                    />
                    <Field
                      label="Unidade"
                      required
                      value={item.unit}
                      onChange={(unit) => update({ unit })}
                    />
                    <NumberField
                      label="Preço unitário (R$)"
                      value={item.unitPriceCents}
                      digits={2}
                      onChange={(unitPriceCents) => update({ unitPriceCents })}
                    />
                  </div>
                  <Field
                    label="Origem da estimativa"
                    required
                    value={item.estimateSource}
                    onChange={(estimateSource) => update({ estimateSource })}
                  />
                  <Field
                    label="Observação"
                    multiline
                    value={item.note}
                    onChange={(note) => update({ note })}
                  />
                  <p>
                    Total do item: <strong>{brl(sum.lines[n] ?? 0)}</strong>
                  </p>
                  <button
                    type="button"
                    disabled={q.items.length >= 40}
                    onClick={() =>
                      change((o) => ({
                        ...o,
                        items: [
                          ...o.items,
                          { ...item, id: crypto.randomUUID() },
                        ],
                      }))
                    }
                  >
                    Duplicar item {n + 1}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() =>
                      change((o) => ({
                        ...o,
                        items: o.items.filter((i) => i.id !== item.id),
                      }))
                    }
                  >
                    Remover item {n + 1}
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              disabled={q.items.length >= 40}
              onClick={() =>
                change((o) => ({ ...o, items: [...o.items, blankItem()] }))
              }
            >
              Adicionar item
            </button>
            <label>
              Tipo de desconto
              <select
                value={q.discount.kind}
                onChange={(e) =>
                  change((o) => ({
                    ...o,
                    discount: {
                      kind: e.target.value as "fixed" | "percent",
                      value: 0,
                    },
                  }))
                }
              >
                <option value="fixed">Valor fixo em reais</option>
                <option value="percent">
                  Percentual sobre subtotal dos itens
                </option>
              </select>
            </label>
            <NumberField
              key={q.discount.kind}
              label={
                q.discount.kind === "fixed" ? "Desconto (R$)" : "Desconto (%)"
              }
              digits={2}
              value={q.discount.value}
              max={q.discount.kind === "percent" ? 10000 : 100_000_000}
              onChange={(value) =>
                change((o) => ({ ...o, discount: { ...o.discount, value } }))
              }
            />
            <p>
              Desconto limitado ao subtotal. Acréscimo fixo aplicado depois;
              nenhum imposto é presumido.
            </p>
            <Field
              label="Descrição do acréscimo"
              value={q.additionalCharges.description}
              onChange={(description) =>
                change((o) => ({
                  ...o,
                  additionalCharges: { ...o.additionalCharges, description },
                }))
              }
            />
            <NumberField
              label="Acréscimo (R$)"
              value={q.additionalCharges.amountCents}
              digits={2}
              onChange={(amountCents) =>
                change((o) => ({
                  ...o,
                  additionalCharges: { ...o.additionalCharges, amountCents },
                }))
              }
            />
            <p>
              Subtotal {brl(sum.subtotal)} · Desconto {brl(sum.discount)} ·
              Acréscimo {brl(sum.additional)}
            </p>
            <p className={styles.total}>Total: {brl(sum.total)}</p>
          </fieldset>
          <fieldset>
            <legend>Condições</legend>
            {Object.entries(termLabels).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                multiline
                value={q.terms[key as keyof Quote["terms"]]}
                onChange={(v) =>
                  change((o) => ({ ...o, terms: { ...o.terms, [key]: v } }))
                }
              />
            ))}
          </fieldset>
          <button type="submit">Revisar orçamento</button>
        </form>
        <section className={styles.local}>
          <h2>Arquivos e dispositivo</h2>
          <p>
            Salvar é opcional. Pessoas com acesso a este navegador podem ler os
            documentos. Limpar os dados do navegador remove os salvos. Não use
            em computador compartilhado.
          </p>
          <button
            onClick={() => {
              if (validDraft()) save(q);
            }}
          >
            Salvar neste dispositivo
          </button>{" "}
          <button
            onClick={() =>
              attempt(() => {
                setSaved(readQuotes(localStorage));
                setLoaded(true);
                setMessage("Lista local carregada.");
              })
            }
          >
            Listar documentos salvos
          </button>
          <p>
            O JSON contém dados do cliente. Guarde o arquivo em local privado e
            só o compartilhe por sua decisão.
          </p>
          <button
            onClick={() => {
              if (validDraft()) exportJSON();
            }}
          >
            Exportar JSON
          </button>
          <label>
            Importar JSON (até 512 KB)
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  if (file.size > MAX_BYTES)
                    throw Error("Arquivo excede 512 KB.");
                  const doc = importQuote(await file.text());
                  replace(() => load(doc));
                } catch {
                  setMessage(
                    "Importação recusada: use JSON versão 1 válido, até 512 KB, sem HTML e dentro dos limites. O orçamento atual foi mantido.",
                  );
                }
              }}
            />
          </label>
          <button onClick={() => replace(() => load(blankQuote()))}>
            Novo orçamento
          </button>
          {loaded ? (
            <>
              <h3>Documentos neste navegador</h3>
              {!saved.length ? (
                <p>Nenhum documento salvo.</p>
              ) : (
                <ul>
                  {saved.map((doc, n) => (
                    <li key={`${doc.id}-${doc.revision}-${doc.status}`}>
                      {doc.documentNumber || "Sem número"} — revisão{" "}
                      {doc.revision},{" "}
                      {doc.status === "issued" ? "emitido" : "rascunho"}{" "}
                      <button onClick={() => replace(() => load(doc))}>
                        Abrir documento {n + 1}
                      </button>{" "}
                      <button
                        onClick={() =>
                          replace(() =>
                            load({
                              ...doc,
                              id: crypto.randomUUID(),
                              status: "draft",
                              revision: 1,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            }),
                          )
                        }
                      >
                        Duplicar documento {n + 1}
                      </button>{" "}
                      <button
                        onClick={() =>
                          replace(() =>
                            attempt(() => {
                              const next = readQuotes(localStorage).filter(
                                (p) =>
                                  !(
                                    p.id === doc.id &&
                                    p.revision === doc.revision &&
                                    p.status === doc.status
                                  ),
                              );
                              writeQuotes(localStorage, next);
                              setSaved(next);
                              setMessage("Documento excluído.");
                            }),
                          )
                        }
                      >
                        Excluir documento {n + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() =>
                  replace(() =>
                    attempt(() => {
                      clearQuotes(localStorage);
                      setSaved([]);
                      setMessage(
                        "Documentos locais apagados. O formulário em memória foi mantido.",
                      );
                    }),
                  )
                }
              >
                Apagar todos os documentos locais
              </button>
            </>
          ) : null}
        </section>
      </div>
      {review ? (
        <>
          <div className={styles.editor}>
            <button onClick={() => setReview(false)}>Voltar à edição</button>{" "}
            <button
              onClick={() => {
                window.print();
                analytics.track({ name: "quote_export", format: "pdf" });
              }}
            >
              Imprimir / salvar PDF
            </button>{" "}
            <button
              disabled={q.status === "issued"}
              onClick={() => {
                const doc = {
                  ...q,
                  status: "issued" as const,
                  updatedAt: new Date().toISOString(),
                };
                attempt(() => {
                  const previous = readQuotes(localStorage);
                  writeQuotes(localStorage, withDocument(previous, doc));
                  setSaved(readQuotes(localStorage));
                  setLoaded(true);
                  setQ(doc);
                  setMessage(
                    "Snapshot emitido salvo localmente. Editar cria nova revisão; o snapshot anterior permanece.",
                  );
                });
              }}
            >
              Emitir e salvar snapshot neste dispositivo
            </button>
            <p>
              Emitir grava uma cópia local, sem validade jurídica especial. A
              edição posterior cria nova revisão. Na impressão, desative
              cabeçalhos e rodapés do navegador se não quiser URL e data.
            </p>
          </div>
          <article id="revisao" tabIndex={-1} className={styles.document}>
            <h2>Orçamento {q.documentNumber}</h2>
            <p>
              Revisão {q.revision} ·{" "}
              {q.status === "issued" ? "Emitido" : "Rascunho"} ·{" "}
              {new Date(q.updatedAt).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
            </p>
            <h3>Prestador</h3>
            {Object.values(q.provider)
              .filter(Boolean)
              .map((v, n) => (
                <p key={n}>{v}</p>
              ))}
            <h3>Cliente</h3>
            {Object.values(q.customer)
              .filter(Boolean)
              .map((v, n) => (
                <p key={n}>{v}</p>
              ))}
            <h3>Atendimento</h3>
            {Object.entries(q.serviceContext)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <p key={k}>
                  <strong>
                    {
                      {
                        citySize: "Porte da cidade",
                        serviceType: "Tipo de serviço",
                        equipment: "Equipamento",
                        report: "Relato",
                        notes: "Observações",
                        modality: "Modalidade",
                        locality: "Localidade",
                        estimatedHours: "Horas estimadas",
                        serialNumber: "Série",
                      }[k]
                    }
                    :{" "}
                  </strong>
                  {v}
                </p>
              ))}
            <table>
              <thead>
                <tr>
                  <th>Item / origem</th>
                  <th>Qtd.</th>
                  <th>Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((i, n) => (
                  <tr key={i.id}>
                    <td>
                      {i.description} ({i.kind})<br />
                      {i.note}
                      <br />
                      Origem: {i.estimateSource}
                    </td>
                    <td>
                      {(i.quantityMillis / 1000).toLocaleString("pt-BR")}{" "}
                      {i.unit}
                    </td>
                    <td>{brl(i.unitPriceCents)}</td>
                    <td>{brl(sum.lines[n] ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.summary}>
              <p>Subtotal: {brl(sum.subtotal)}</p>
              <p>
                Desconto: {brl(sum.discount)}
                {q.discount.kind === "percent"
                  ? ` (${q.discount.value / 100}%)`
                  : ""}
              </p>
              <p>
                Acréscimo: {brl(sum.additional)} —{" "}
                {q.additionalCharges.description}
              </p>
              <p>
                <strong>Total: {brl(sum.total)}</strong>
              </p>
            </div>
            <h3>Condições</h3>
            {Object.entries(termLabels).map(([k, label]) =>
              q.terms[k as keyof Quote["terms"]] ? (
                <div key={k}>
                  <h4>{label}</h4>
                  <p>{q.terms[k as keyof Quote["terms"]]}</p>
                </div>
              ) : null,
            )}
            <p>
              Valores definidos pelo profissional. Estimativas sujeitas às
              condições e ao diagnóstico informado. Proposta não é nota fiscal
              nem laudo.
            </p>
          </article>
        </>
      ) : (
        <p className={styles.editor}>
          Revise o orçamento para preparar o documento de impressão.
        </p>
      )}
    </div>
  );
}
