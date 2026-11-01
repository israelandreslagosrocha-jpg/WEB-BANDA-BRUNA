export function validEndpoint(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)&&u.pathname.length>1;}catch{return false;}
}
export function validateSubscription(value){
 if(!value||!validEndpoint(value.endpoint))throw new Error('Servicio push no compatible.');
 if(!/^[A-Za-z0-9_-]{87}$/.test(value.keys?.p256dh||'')||!/^[A-Za-z0-9_-]{22}$/.test(value.keys?.auth||''))throw new Error('Suscripción push inválida.');
 return {endpoint:value.endpoint,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth}};
}
export function pushPayload(entry){return JSON.stringify({title:'Banda Bruna · Novedades',body:'Tienes un nuevo aviso en tu intranet. Ingresa para revisarlo.',url:'/admin/personal',tag:`intranet-${entry.id}`});}
