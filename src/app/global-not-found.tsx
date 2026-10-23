import Link from "next/link";
import './globals.css';
export const metadata={title:'Página não encontrada',robots:{index:false,follow:false}};
export default function GlobalNotFound(){return <html lang="pt-BR"><body><main id="conteudo" className="document"><p>404</p><h1>Página não encontrada</h1><p>Este endereço não está disponível.</p><Link className="button" href="/">Voltar ao início</Link></main></body></html>;}
