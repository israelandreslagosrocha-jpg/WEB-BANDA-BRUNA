import { intranetAuth } from '../../../modules/intranet/auth.js';
import { validateSubscription,validEndpoint } from '../../../modules/intranet/pushValidation.js';
import { jsonResponse } from '../../../services/serverAuth.js';
export const prerender=false;
const env=n=>process.env[n]||import.meta.env[n];
export async function GET({request}){
 if(!await intranetAuth(request))return jsonResponse({error:'Acceso no autorizado.'},401);
 const publicKey=env('PUSH_VAPID_PUBLIC_KEY');
 return jsonResponse({enabled:!!(publicKey&&env('PUSH_VAPID_PRIVATE_KEY')&&env('PUSH_WORKER_SECRET')),publicKey:publicKey||null});
}
export async function POST({request}){
 try{
  const auth=await intranetAuth(request);if(!auth)return jsonResponse({error:'Acceso no autorizado.'},401);
  const raw=await request.text();if(raw.length>5000)return jsonResponse({error:'Solicitud demasiado extensa.'},413);
  const subscription=validateSubscription(JSON.parse(raw));
  const {error}=await auth.client.from('intranet_push_subscriptions').upsert({user_id:auth.user.id,member_email:auth.user.email.toLowerCase(),endpoint:subscription.endpoint,subscription},{onConflict:'endpoint'});
  if(error)return jsonResponse({error:'No se pudo guardar el dispositivo. Revisa la activación de notificaciones en Supabase.'},400);
  return jsonResponse({ok:true});
 }catch{return jsonResponse({error:'Suscripción inválida.'},400);}
}
export async function DELETE({request}){
 try{
  const auth=await intranetAuth(request);if(!auth)return jsonResponse({error:'Acceso no autorizado.'},401);
  const raw=await request.text();if(raw.length>5000)return jsonResponse({error:'Solicitud demasiado extensa.'},413);
  const {endpoint}=JSON.parse(raw);if(!validEndpoint(endpoint))return jsonResponse({error:'Dispositivo inválido.'},400);
  const {error}=await auth.client.from('intranet_push_subscriptions').delete().eq('user_id',auth.user.id).eq('endpoint',endpoint);
  return jsonResponse(error?{error:'No se pudo desactivar el dispositivo.'}:{ok:true},error?400:200);
 }catch{return jsonResponse({error:'Solicitud inválida.'},400);}
}
