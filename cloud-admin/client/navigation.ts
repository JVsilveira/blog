const router={replace:(url:string)=>window.location.assign(url),refresh:()=>{}};
export function useRouter(){return router;}
