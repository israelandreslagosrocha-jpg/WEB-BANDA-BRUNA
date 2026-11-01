import webpush from 'web-push';
import { timingSafeEqual } from 'node:crypto';
import { createServiceSupabaseClient,jsonResponse } from '../../../services/serverAuth.js';
import { validateSubscription,pushPayload } from '../../../modules/intranet/pushValidation.js';
export const prerender=false;
const env=n=>process.env[n]||import.meta.env[n];
export async function POST({request}){
 const expected=env('PUSH_WORKER_SECRET')||'',received=request.headers.get('x-push-secret')||'';
 if(!expected||Buffer.byteLength(expected)!==Buffer.byteLength(received)||!timingSafeEqual(Buffer.from(expected),Buffer.from(received)))return jsonResponse({error:'Acceso no autorizado.'},401);
 if(!env('PUSH_VAPID_PUBLIC_KEY')||!env('PUSH_VAPID_PRIVATE_KEY'))return jsonResponse({error:'Push pendiente de configurar.'},503);
 try{
  webpush.setVapidDetails('mailto:contacto@bandabruna.cl',env('PUSH_VAPID_PUBLIC_KEY'),env('PUSH_VAPID_PRIVATE_KEY'));
  const db=createServiceSupabaseClient();
  const {data:jobs,error}=await db.rpc('intranet_claim_push',{batch_size:10});if(error)throw error;
  let accepted=0;
  await Promise.all((jobs||[]).map(async job=>{
   let status='failed',code=null;
   try{
    const [{data:sub,error:se},{data:entry,error:ee}]=await Promise.all([db.from('intranet_push_subscriptions').select('*').eq('id',job.subscription_id).single(),db.from('intranet_entries').select('id,author_email,recipients').eq('id',job.entry_id).single()]);
    if(se||ee)throw new Error('lookup_failed');
    if(!['vicentenunez@bandabruna.cl','jaimecardenas@bandabruna.cl','cesarbruna@bandabruna.cl'].includes(entry.author_email)||sub.member_email===entry.author_email||(entry.recipients.length&&!entry.recipients.includes(sub.member_email))){status='skipped';}
    else{
     const subscription=validateSubscription(sub.subscription);
     status='unknown';
     await webpush.sendNotification(subscription,pushPayload(entry),{TTL:3600,urgency:'high',timeout:10000});status='accepted';accepted++;
    }
   }catch(e){code=Number.isInteger(e.statusCode)?String(e.statusCode):'processing_error';if(['404','410'].includes(code)){status='expired';await db.from('intranet_push_subscriptions').delete().eq('id',job.subscription_id);}else if(e.statusCode)status='failed';}
   const {error:saveError}=await db.from('intranet_push_outbox').update({status,error_code:code,processed_at:new Date().toISOString()}).eq('id',job.id);
   if(saveError)throw saveError;
  }));
  return jsonResponse({processed:jobs?.length||0,accepted});
 }catch{return jsonResponse({error:'No se pudo completar el envío. Revisar la cola.'},500);}
}
