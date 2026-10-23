import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
export function Button(props: ComponentProps<"button">) {
  return <button {...props} className={`button ${props.className ?? ""}`} />;
}
export function TextLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />;
}
export function Input({
  label,
  id,
  ...props
}: ComponentProps<"input"> & { label: string; id: string }) {
  return (
    <label className="field" htmlFor={id}>
      {label}
      <input id={id} {...props} />
    </label>
  );
}
export function Select({
  label,
  id,
  ...props
}: ComponentProps<"select"> & { label: string; id: string }) {
  return (
    <label className="field" htmlFor={id}>
      {label}
      <select id={id} {...props} />
    </label>
  );
}
export function Checkbox({
  children,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <label className="check">
      <input {...props} type="checkbox" />
      {children}
    </label>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Alert({
  children,
  urgent = false,
}: {
  children: ReactNode;
  urgent?: boolean;
}) {
  return (
    <div className="alert" role={urgent ? "alert" : "note"}>
      {children}
    </div>
  );
}
export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details>
      <summary>{title}</summary>
      {children}
    </details>
  );
}
export function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav aria-label="Caminho da página" className="breadcrumbs">
      <Link href="/">Início</Link>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}
export function EditorialCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <article className="editorial-card">
      <h3>
        <Link href={href}>{title}</Link>
      </h3>
      <p>{description}</p>
    </article>
  );
}
// Nenhum espaço publicitário é reservado enquanto a integração estiver desligada.
export function AdSlot() {
  return null;
}
