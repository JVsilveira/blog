import {createRoot} from 'react-dom/client';
import {Dashboard} from '../../admin/components/Dashboard';
import '../../admin/app/admin.css';
async function start(){
 const response=await fetch('/api/bootstrap',{cache:'no-store'});
 if(response.status===401){location.replace('/login');return;}
 const data=await response.json();if(!response.ok)throw new Error(data.error);
 document.getElementById('root')!.removeAttribute('role');
 createRoot(document.getElementById('root')!).render(<Dashboard {...data} online/>);
}
void start().catch(()=>{document.getElementById('root')!.textContent='Não foi possível carregar o painel. Recarregue a página.';});
