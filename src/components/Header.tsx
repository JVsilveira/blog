"use client";
import Link from "next/link";
import { useRef } from "react";
import { site } from "../config/site";
import { copy, homePath, type Locale } from "../features/publication/i18n";
import { Button } from "./ui";
export function Header({locale="pt"}:{locale?:Locale}) {
  const c=copy[locale];
  const links=[
    {href:locale==='pt'?'/noticias/':`/${locale}/news/`,label:c.news},
    {href:locale==='pt'?'/blog/':`/${locale}/blog/`,label:c.guides},
    {href:'/ferramentas-ti/',label:c.itTools},
    {href:'/recomendacoes/',label:c.recommendations},
  ];
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    dialog.current?.close();
    trigger.current?.focus();
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href={homePath(locale)} aria-label={`${site.name} — ${c.home}`}>
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M4 8h24M16 8v20M4 20V8m24 12V8"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
          {site.name}
        </Link>
        <nav className="desktop-nav" aria-label={c.navigation}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="button menu-trigger"
          ref={trigger}
          onClick={() => dialog.current?.showModal()}
          aria-haspopup="dialog"
        >
          {c.menu}
        </button>
        <dialog
          ref={dialog}
          aria-labelledby="menu-title"
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const items =
              dialog.current?.querySelectorAll<HTMLElement>("button, a[href]");
            const first = items?.[0];
            const last = items?.[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <div className="menu-heading">
            <h2 id="menu-title">{c.navigation}</h2>
            <Button onClick={close}>{c.close}</Button>
          </div>
          <nav aria-label={c.navigation}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={close}>
                {l.label}
              </Link>
            ))}
          </nav>
        </dialog>
      </div>
    </header>
  );
}
