"use client";
import {BrandLogo} from "../../src/components/BrandLogo";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { HardwareManager } from "./HardwareManager";
import { AccountProfile } from "./AccountProfile";
import { TranslationEditor, type TranslationDraft } from "./TranslationEditor";
import { TitleAssistant } from "./TitleAssistant";
import type { Article } from "../../src/domain/schemas";
import type { BuildJob } from "../lib/build";
import type { Workspace } from "../lib/workspace";
const statuses = {
  draft: "Rascunho",
  published: "Aprovado para publicação",
  archived: "Arquivado",
};
const blank = {
  featuredOrder:null as number|null,
  kind:"opinion" as "blog"|"news"|"opinion",
  translations:[] as TranslationDraft[],
  slug: "",
  title: "",
  description: "",
  authorId: "",
  category: "",
  tags: [] as string[],
  sourceIds: [] as string[],
  relatedProductIds: [] as string[],
  methodology: "Rascunho: método e evidências pendentes.",
  limitations: "Não revisado; não publicar.",
  body: "",
  status: "draft" as Article["status"],
  approved: false,
};
type Draft = typeof blank;
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Dashboard({
  email,
  name,
  picture,
  csrf,
  initial,
  titleAI,
  initialTab='articles',
  mercadoFeedback,
}: {
  initialTab?:'articles'|'hardware';
  mercadoFeedback?:'connected'|'error';
  email: string;
  name?: string;
  picture?: string;
  csrf: string;
  initial: Workspace | null;
  titleAI: { enabled: boolean; reason: string };
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(initial);
  const [tab, setTab] = useState<"articles" | "editor" | "sources" | "authors" | "hardware">(
    initialTab,
  );
  const [draft, setDraft] = useState<Draft>({ ...blank });
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeResource, setActiveResource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestingTitle, setSuggestingTitle] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [job, setJob] = useState<BuildJob | null>(null);
  const building = job?.state === "queued" || job?.state === "running";
  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch("/api/build", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json();
          setJob(result.job);
        }
      } catch {
        /* A próxima consulta pode recuperar uma interrupção de rede. */
      }
    };
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  async function generate() {
    if (busy || building) return;
    setBusy(true);
    setMessage("Agendando a geração…");
    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "X-CSRF-Token": csrf },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setJob(result.job);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar a versão.",
      );
    } finally {
      setBusy(false);
    }
  }
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setWorkspace(result);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível carregar.",
      );
    }
  }, [router]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function navigate(next: typeof tab) {
    if (
      dirty &&
      !window.confirm("Descartar as alterações que ainda não foram salvas?")
    )
      return;
    setDirty(false);
    setActiveResource(null);
    setMessage("");
    setTab(next);
  }
  async function save(input: object) {
    if (!workspace || busy || suggestingTitle) return;
    setBusy(true);
    setMessage("Salvando…");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ ...input, revision: workspace.revision }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      if (!response.ok) throw new Error(result.error);
      setWorkspace(result);
      setDirty(false);
      setActiveResource(null);
      setMessage(
        "Conteúdo salvo. As alterações no site público dependem da geração e entrega de uma nova versão.",
      );
      if ("slug" in input) setEditing(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (dirty && !window.confirm("Sair e descartar alterações não salvas?"))
      return;
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrf },
      });
      if (response.ok || response.status === 401) {
        router.replace("/login");
        router.refresh();
      } else setMessage("Não foi possível sair. Tente novamente.");
    } catch {
      setMessage(
        "Não foi possível sair. Confira sua conexão e tente novamente.",
      );
    }
  }
  function edit(article?: Article) {
    if (dirty && !window.confirm("Descartar as alterações não salvas?")) return;
    setDraft(
      article
        ? {
            featuredOrder:article.featuredOrder ?? null,
            kind:article.kind ?? "blog",
            translations:(article.translations ?? []).map(t=>({...t,approved:false})),
            slug: article.slug,
            title: article.title,
            description: article.description,
            authorId: article.authorId,
            category: article.category,
            tags: [...article.tags],
            sourceIds: [...article.sourceIds],
            relatedProductIds: [...article.relatedProductIds],
            methodology: article.methodology,
            limitations: article.limitations,
            body: article.body,
            status: article.status,
            approved: false,
          }
        : { ...blank, authorId: workspace?.data.authors[0]?.id ?? "" },
    );
    setEditing(!!article);
    setDirty(false);
    setActiveResource(null);
    setPreview(false);
    setMessage("");
    setTab("editor");
  }
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key !== "approved" ? { approved: false } : {}),
    }));
    setDirty(true);
  }
  const articles =
    workspace?.data.articles.filter((a) =>
      `${a.title} ${a.category}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
    ) ?? [];
  return (
    <>
      <header className="admin-header">
        <strong className="admin-brand">
          <BrandLogo /> <span>Área editorial</span>
        </strong>
        <div className="admin-account">
          <AccountProfile email={email} name={name} picture={picture} />
          <button onClick={() => void logout()} disabled={busy}>
            Sair
          </button>
        </div>
      </header>
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Área editorial">
          <button
            aria-current={
              tab === "articles" || tab === "editor" ? "page" : undefined
            }
            onClick={() => navigate("articles")}
          >
            Postagens
          </button>
          <button
            aria-current={tab === "sources" ? "page" : undefined}
            onClick={() => navigate("sources")}
          >
            Fontes
          </button>
          <button
            aria-current={tab === "authors" ? "page" : undefined}
            onClick={() => navigate("authors")}
          >
            Autoria
          </button>
          <button aria-current={tab === "hardware" ? "page" : undefined} onClick={()=>navigate("hardware")}>Produtos e comparadores</button>
        </nav>
        <main id="conteudo" tabIndex={-1}>
          <p role="status" className="status-message">
            {message}
          </p>
          {!workspace ? (
            <section>
              <h1>Área editorial</h1>
              <p>Carregando seus conteúdos…</p>
              <button onClick={() => void load()}>Tentar novamente</button>
            </section>
          ) : (
            <>
              {tab === "hardware" && <HardwareManager mercadoFeedback={mercadoFeedback} csrf={csrf} building={building} buildMessage={job?.message??""} onGenerate={generate} onDirtyChange={setDirty}/>}
              {tab === "articles" && (
                <section>
                  <div className="page-heading">
                    <div>
                      <h1>Suas postagens</h1>
                      <p className="muted">
                        Do primeiro rascunho à revisão final.
                      </p>
                    </div>
                    <button className="button" onClick={() => edit()}>
                      Nova postagem
                    </button>
                  </div>
                  <Field label="Encontrar postagem">
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </Field>
                  {articles.length ? (
                    <ul className="post-list">
                      {articles.map((article) => (
                        <li key={article.id}>
                          <div>
                            <span className="badge">
                              {statuses[article.status]}
                            </span>
                            <h2>
                              <button
                                className="post-title"
                                onClick={() => edit(article)}
                              >
                                {article.title}
                              </button>
                            </h2>
                            <p>{article.category}</p>
                            <p className="muted">{article.description}</p>
                          </div>
                          <button onClick={() => edit(article)}>Editar</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="notice">Nenhuma postagem encontrada.</p>
                  )}
                  <section className="notice">
                    <h2>Como o conteúdo chega ao site</h2>
                    <p>
                      Salve o rascunho, confira a prévia e aprove o texto após a
                      revisão. O site público recebe as alterações quando uma
                      nova versão é gerada e enviada à hospedagem.
                    </p>
                    <div className="actions">
                      <button
                        onClick={() => void load()}
                        disabled={busy || building}
                      >
                        Recarregar lista
                      </button>
                      <button
                        className="button"
                        onClick={() => void generate()}
                        disabled={busy || building}
                      >
                        {building
                          ? "Gerando versão…"
                          : "Gerar versão do portal"}
                      </button>
                    </div>
                    {job && (
                      <p role="status" className="build-status">
                        {job.message}
                      </p>
                    )}
                  </section>
                </section>
              )}
              {tab === "editor" && (
                <section>
                  <div className="page-heading">
                    <h1>{editing ? "Editar postagem" : "Nova postagem"}</h1>
                    <button onClick={() => setPreview(!preview)}>
                      {preview ? "Voltar ao editor" : "Ver prévia"}
                    </button>
                  </div>
                  {preview ? (
                    <article className="preview">
                      <p className="badge">Prévia de rascunho</p>
                      <h2>{draft.title || "Título da postagem"}</h2>
                      <p className="intro">{draft.description}</p>
                      <p>{draft.kind === "blog" ? "Blog e guia" : "Notícia e opinião"} — {draft.category}</p>
                      <div className="article-body">
                        <Markdown
                          skipHtml
                          urlTransform={(url) =>
                            /^(https:\/\/|\/(?!\/)|#)/.test(url)
                              ? url
                              : undefined
                          }
                          components={{
                            img: () => (
                              <span>Imagem pendente de autorização.</span>
                            ),
                          }}
                        >
                          {draft.body}
                        </Markdown>
                      </div>
                      <aside className="notice">
                        <h3>Método e limitações</h3>
                        <p>{draft.methodology}</p>
                        <p>{draft.limitations}</p>
                      </aside>
                    </article>
                  ) : (
                    <form
                      id="article-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void save({
                          action: "article",
                          ...draft,
                          creating: !editing,
                        });
                      }}
                    >
                      <div className="form-grid">
                        <Field label="Tipo de publicação">
                          <select value={draft.kind === "news" ? "opinion" : draft.kind} onChange={e=>change("kind",e.target.value as Draft["kind"])}>
                            <option value="opinion">Notícia e opinião</option><option value="blog">Blog e guia</option>
                          </select>
                        </Field>
                        <div className="field title-field">
                          <label htmlFor="article-title">Título</label>
                          <input
                            id="article-title"
                            required
                            maxLength={300}
                            value={draft.title}
                            onChange={(e) => change("title", e.target.value)}
                          />
                          <TitleAssistant key={draft.slug} csrf={csrf} disabled={busy || building}
                            unavailableReason={titleAI.enabled ? "" : titleAI.reason}
                            onPendingChange={setSuggestingTitle}
                            onApply={(title) => change("title", title)}
                            article={{ kind:draft.kind, title: draft.title, description: draft.description,
                              category: draft.category, methodology: draft.methodology,
                              limitations: draft.limitations, body: draft.body }} />
                        </div>
                        <Field label="Endereço da postagem (slug)">
                          <input
                            required
                            pattern="[a-z0-9]+(-[a-z0-9]+)*"
                            disabled={editing}
                            value={draft.slug}
                            onChange={(e) => change("slug", e.target.value)}
                          />
                        </Field>
                        <Field label="Resumo">
                          <textarea
                            required
                            maxLength={1000}
                            value={draft.description}
                            onChange={(e) =>
                              change("description", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Categoria">
                          <input
                            required
                            maxLength={100}
                            list="editorias"
                            value={draft.category}
                            onChange={(e) => change("category", e.target.value)}
                          />
                          <datalist id="editorias">{Array.from(new Set(["Política","Esporte","Economia","Tecnologia","Cultura","Mundo","Ciência",...workspace.data.articles.map(a=>a.category)])).sort().map(category=><option key={category} value={category}/>)}</datalist>
                        </Field>
                        <Field label="Ordem de destaque">
                          <input type="number" min={1} max={99999} step={1} value={draft.featuredOrder ?? ""}
                            onChange={e=>change("featuredOrder",e.target.value === "" ? null : Number(e.target.value))}/>
                          <small>1 aparece primeiro, 2 em seguida. Em branco, segue por data. Em empates, o mais recente vem antes.</small>
                        </Field>
                        <Field label="Autor">
                          <select
                            required
                            value={draft.authorId}
                            onChange={(e) => change("authorId", e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {workspace.data.authors.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                                {a.status !== "published"
                                  ? " — revisão pendente"
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Tags separadas por vírgula">
                          <input
                            value={draft.tags.join(", ")}
                            onChange={(e) =>
                              change(
                                "tags",
                                e.target.value.split(",").map((t) => t.trim()),
                              )
                            }
                            onBlur={() =>
                              setDraft((d) => ({
                                ...d,
                                tags: d.tags.filter(Boolean),
                              }))
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Conteúdo em Markdown">
                        <textarea
                          className="markdown-editor"
                          required
                          maxLength={200000}
                          value={draft.body}
                          onChange={(e) => change("body", e.target.value)}
                        />
                      </Field>
                      <p className="muted">
                        Use ## para subtítulos, listas e links HTTPS. Imagens
                        precisam de um cadastro de direitos antes da publicação.
                      </p>
                      <div className="form-grid">
                        <Field label="Método e evidências">
                          <textarea
                            required
                            value={draft.methodology}
                            onChange={(e) =>
                              change("methodology", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Limitações">
                          <textarea
                            required
                            value={draft.limitations}
                            onChange={(e) =>
                              change("limitations", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                      <fieldset>
                        <legend>Fontes da postagem</legend>
                        {workspace.data.sources.length ? (
                          workspace.data.sources.map((source) => (
                            <label className="check" key={source.id}>
                              <input
                                type="checkbox"
                                checked={draft.sourceIds.includes(source.id)}
                                onChange={(e) =>
                                  change(
                                    "sourceIds",
                                    e.target.checked
                                      ? [...draft.sourceIds, source.id]
                                      : draft.sourceIds.filter(
                                          (id) => id !== source.id,
                                        ),
                                  )
                                }
                              />
                              {source.publisher} — {source.scope.join("; ")}{" "}
                              {source.status !== "published" &&
                                "(revisão pendente)"}
                            </label>
                          ))
                        ) : (
                          <p>
                            Cadastre uma fonte na seção Fontes antes de aprovar
                            a publicação.
                          </p>
                        )}
                      </fieldset>
                      <TranslationEditor translations={draft.translations} onChange={value=>change("translations",value)} />
                      <Field label="Estado">
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            change("status", e.target.value as Draft["status"])
                          }
                        >
                          <option value="draft">Rascunho</option>
                          <option value="published">
                            Aprovado para publicação
                          </option>
                          <option value="archived">Arquivado</option>
                        </select>
                      </Field>
                      {draft.status === "published" && (
                        <label className="check notice">
                          <input
                            type="checkbox"
                            required
                            checked={draft.approved}
                            onChange={(e) =>
                              change("approved", e.target.checked)
                            }
                          />
                          Revisei este conteúdo, suas fontes, método e
                          limitações e autorizo sua inclusão na próxima versão
                          do site.
                        </label>
                      )}
                      <button className="button" disabled={busy || suggestingTitle} type="submit">
                        {busy
                          ? "Salvando…"
                          : draft.status === "published"
                            ? "Salvar aprovação"
                            : "Salvar postagem"}
                      </button>
                    </form>
                  )}
                </section>
              )}
              {tab === "authors" && (
                <section>
                  <h1>Autoria</h1>
                  <p className="muted">
                    Identifique quem escreve e confirme os dados antes de
                    publicar.
                  </p>
                  {workspace.data.authors.map((author) => (
                    <AuthorForm
                      key={author.id + workspace.revision}
                      author={author}
                      busy={
                        busy ||
                        !!(
                          activeResource &&
                          activeResource !== "author:" + author.id
                        )
                      }
                      save={save}
                      markDirty={() => {
                        setDirty(true);
                        setActiveResource("author:" + author.id);
                      }}
                    />
                  ))}
                  <h2>Novo autor</h2>
                  <AuthorForm
                    busy={
                      busy ||
                      !!(activeResource && activeResource !== "new-author")
                    }
                    save={save}
                    markDirty={() => {
                      setDirty(true);
                      setActiveResource("new-author");
                    }}
                  />
                </section>
              )}
              {tab === "sources" && (
                <section>
                  <h1>Fontes</h1>
                  <p className="muted">
                    Registre as referências e o que cada uma sustenta.
                  </p>
                  {workspace.data.sources.map((source) => (
                    <SourceForm
                      key={source.id + workspace.revision}
                      source={source}
                      busy={
                        busy ||
                        !!(
                          activeResource &&
                          activeResource !== "source:" + source.id
                        )
                      }
                      save={save}
                      markDirty={() => {
                        setDirty(true);
                        setActiveResource("source:" + source.id);
                      }}
                    />
                  ))}
                  <h2>Nova fonte</h2>
                  <SourceForm
                    busy={
                      busy ||
                      !!(activeResource && activeResource !== "new-source")
                    }
                    save={save}
                    markDirty={() => {
                      setDirty(true);
                      setActiveResource("new-source");
                    }}
                  />
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
function AuthorForm({
  author,
  busy,
  save,
  markDirty,
}: {
  markDirty: () => void;
  author?: Workspace["data"]["authors"][number];
  busy: boolean;
  save: (value: object) => Promise<void>;
}) {
  return (
    <form
      className="resource-form"
      onChange={markDirty}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void save({
          action: "author",
          creating: !author,
          id: author?.id ?? form.get("id"),
          name: form.get("name"),
          approved: form.get("approved") === "on",
        });
      }}
    >
      <fieldset className="resource-fields" disabled={busy}>
        <Field label="Identificador">
          <input
            name="id"
            required
            disabled={!!author}
            defaultValue={author?.id}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </Field>
        <Field label="Nome do autor">
          <input
            name="name"
            required
            maxLength={200}
            defaultValue={author?.name}
          />
        </Field>
        <p className="muted">
          Estado atual:{" "}
          {author?.status === "published" ? "Aprovado" : "Rascunho"}
        </p>
        <label className="check">
          <input type="checkbox" name="approved" />
          Conferi os dados e aprovo esta autoria para publicação.
        </label>
        <button type="submit" disabled={busy}>
          Salvar autor
        </button>
      </fieldset>
    </form>
  );
}
function SourceForm({
  source,
  busy,
  save,
  markDirty,
}: {
  markDirty: () => void;
  source?: Workspace["data"]["sources"][number];
  busy: boolean;
  save: (value: object) => Promise<void>;
}) {
  return (
    <form
      className="resource-form"
      onChange={markDirty}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const accessed = String(form.get("accessedAt"));
        void save({
          action: "source",
          creating: !source,
          id: source?.id ?? form.get("id"),
          url: form.get("url"),
          publisher: form.get("publisher"),
          accessedAt: accessed ? new Date(accessed).toISOString() : "",
          scope: String(form.get("scope"))
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          note: form.get("note"),
          approved: form.get("approved") === "on",
        });
      }}
    >
      <fieldset className="resource-fields" disabled={busy}>
        <div className="form-grid">
          <Field label="Identificador">
            <input
              name="id"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              disabled={!!source}
              defaultValue={source?.id}
            />
          </Field>
          <Field label="Responsável pela fonte">
            <input
              name="publisher"
              required
              maxLength={300}
              defaultValue={source?.publisher}
            />
          </Field>
          <Field label="Endereço HTTPS">
            <input type="url" name="url" required defaultValue={source?.url} />
          </Field>
          <Field label="Data da consulta efetiva">
            <input
              type="datetime-local"
              name="accessedAt"
              required
              defaultValue={source ? localDate(source.accessedAt) : ""}
            />
          </Field>
        </div>
        <Field label="O que a fonte sustenta (um item por linha)">
          <textarea
            required
            name="scope"
            defaultValue={source?.scope.join("\n")}
          />
        </Field>
        <Field label="Observações">
          <textarea name="note" defaultValue={source?.note} />
        </Field>
        <p className="muted">
          Estado atual:{" "}
          {source?.status === "published" ? "Aprovada" : "Rascunho"}
        </p>
        <label className="check">
          <input type="checkbox" name="approved" />
          Consultei a referência e aprovo seu uso editorial.
        </label>
        <button type="submit" disabled={busy}>
          Salvar fonte
        </button>
      </fieldset>
    </form>
  );
}
function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
