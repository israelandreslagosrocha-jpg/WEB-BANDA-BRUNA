export async function setupPush(client:any,preview:boolean){
 const box=document.getElementById('push-controls')!;
 const status=document.getElementById('push-state')!;
 const enable=document.getElementById('push-enable') as HTMLButtonElement;
 const disable=document.getElementById('push-disable') as HTMLButtonElement;
 box.hidden=false;
 if(preview){status.textContent='Demostración: en tu cuenta real podrás activar avisos en este dispositivo.';enable.disabled=true;return;}
 if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){status.textContent='Este navegador no permite avisos push. En Android, abre la intranet en Chrome. En iPhone, agrégala a Inicio y ábrela desde su icono.';enable.disabled=true;return;}
 const headers=async()=>{const {data:{session}}=await client.auth.getSession();return {'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`};};
 const call=async(method:string,body?:any)=>{const r=await fetch('/api/intranet/push',{method,headers:await headers(),...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo configurar el dispositivo.');return data;};
 let reg:ServiceWorkerRegistration;
 try{
  const config=await call('GET');
  if(!config.enabled){status.textContent='Avisos push pendientes de activación por administración.';enable.disabled=true;return;}
  reg=await navigator.serviceWorker.register('/intranet-sw.js',{scope:'/admin/'});
  await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  // No mostrar activa una suscripción que aún no esté guardada en esta cuenta.
  if(sub){try{await call('POST',sub.toJSON());}catch{await sub.unsubscribe();sub=null;}}
  const update=(active:boolean)=>{enable.hidden=active;disable.hidden=!active;status.textContent=active?'Avisos activados en este dispositivo.':'Recibe un aviso cuando publiquen novedades para ti.';};
  update(!!sub);
  enable.onclick=async()=>{
   enable.disabled=true;
   try{
    const permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error('Permiso no concedido. Puedes habilitarlo en los ajustes del navegador.');
    const key=Uint8Array.from(atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    const subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
    try{await call('POST',subscription.toJSON());}catch(e){await subscription.unsubscribe();throw e;}
    update(true);
   }catch(e:any){status.textContent=e.message;}finally{enable.disabled=false;}
  };
  disable.onclick=async()=>{disable.disabled=true;try{const current=await reg.pushManager.getSubscription();if(current){await call('DELETE',{endpoint:current.endpoint});await current.unsubscribe();}update(false);}catch(e:any){status.textContent=e.message;}finally{disable.disabled=false;}};
  return async()=>{const current=await reg.pushManager.getSubscription();if(current){await call('DELETE',{endpoint:current.endpoint});await current.unsubscribe();}};
 }catch(e:any){status.textContent=e.message;enable.disabled=true;}
}
