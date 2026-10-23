import styles from './ads.module.css';
// Reserva editorial opcional, sem SDK, IDs, scripts ou requests. Não ativável por flag.
export function AdSlot({placement, preview=false}:{placement:'article-end';preview?:boolean}) {
  if(!preview) return null;
  return <aside className={styles.slot} aria-label="Espaço publicitário desativado" data-placement={placement}>
    <p>Publicidade desativada</p>
  </aside>;
}
