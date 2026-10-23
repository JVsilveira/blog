import path from 'node:path';
import {refreshPhoneRanking} from './phone-ranking';
import {readFile} from 'node:fs/promises';
import {queueHardware,executeHardware,hardwareJob,activeHardwareJob} from './hardware';
export async function automaticSync(root:string,now=Date.now()){
 try{
  try{const pause=JSON.parse(await readFile(path.join(root,'.editorial-admin/icecat-pause.json'),'utf8'));if(typeof pause.until==='number'&&pause.until>now)return;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')return;}
  const last=await hardwareJob(root);if(activeHardwareJob(last))return;
  const finished=last?.finishedAt?Date.parse(last.finishedAt):0;
  // An empty completed cycle sleeps until the next daily delta. Non-empty cycles
  // continue the initial import automatically; a failed index backs off 15 minutes.
  if(last?.mode==='sync'&&last.state==='success'&&last.total===1&&now-finished<86400000)return;
  if(last?.state==='failed'&&last.processed===0&&now-finished<15*60000)return;
  await executeHardware(root,await queueHardware(root,'sync',[],false));
 }catch{/* Another job or temporary provider failure: retry on a later tick. */}
}
export function startAutomaticSync(root:string){
 const key=Symbol.for('portal.icecat.scheduler');const state=globalThis as typeof globalThis & {[key:symbol]:boolean|undefined};if(state[key])return;state[key]=true;
 let running=false;const tick=async()=>{if(running)return;running=true;try{await refreshPhoneRanking(root).catch(()=>{});await automaticSync(root);}finally{running=false;}};
 const first=setTimeout(()=>void tick(),3000);first.unref();const timer=setInterval(()=>void tick(),60000);timer.unref();
}
