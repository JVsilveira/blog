"use client";
import { useState } from "react";
import { Button, Input, Select, EditorialCard } from "../ui";
export type Guide = {
  title: string;
  description: string;
  href: string;
  category: string;
};
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
export function GuideSearch({ guides }: { guides: Guide[] }) {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const found = guides.filter(
    (g) =>
      (!category || g.category === category) &&
      normalize(g.title + " " + g.description).includes(normalize(term.trim())),
  );
  return (
    <div>
      <form
        className="search-form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(query);
        }}
      >
        <Input
          id="duvida"
          label="Qual é a sua dúvida?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Descreva o que você procura"
          type="search"
          maxLength={200}
        />
        <Button type="submit">Buscar guias</Button>
      </form>
      {guides.length > 0 && (
        <Select
          id="categoria"
          label="Filtrar por categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {[...new Set(guides.map((g) => g.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      )}
      <div className="search-status" role="status">
        {term || category
          ? `${found.length} guia(s) encontrado(s).`
          : "A busca consulta apenas guias publicados neste portal."}
      </div>
      {(term || category) && (
        <Button
          onClick={() => {
            setQuery("");
            setTerm("");
            setCategory("");
          }}
        >
          Limpar busca e filtros
        </Button>
      )}
      <div className="guide-list">
        {found.map((g) => (
          <EditorialCard key={g.href} {...g} />
        ))}
      </div>
      {!found.length && (
        <p className="empty">
          {term || category
            ? "Nenhum guia encontrado. Tente outro termo ou limpe a busca."
            : "Ainda não há conteúdo revisado disponível."}
        </p>
      )}
    </div>
  );
}
