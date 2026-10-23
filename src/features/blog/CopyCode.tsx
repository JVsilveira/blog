'use client';
import { useState } from 'react';
export function CopyCode({ text }: { text: string }) {
  const [message, setMessage] = useState('');
  return <><button className="button" type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setMessage('Código copiado.'); }
    catch { setMessage('Não foi possível copiar. Selecione o código e copie manualmente.'); }
  }}>Copiar código</button><span role="status">{message}</span></>;
}
