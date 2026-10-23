export async function register(){
 if(process.env.NEXT_RUNTIME!=='nodejs'||process.env.NEXT_PHASE==='phase-production-build'||process.env.ICECAT_AUTO_SYNC!=='true'||!process.env.EDITORIAL_ROOT)return;
 const {startAutomaticSync}=await import('./lib/hardware-auto');startAutomaticSync(process.env.EDITORIAL_ROOT);
}
