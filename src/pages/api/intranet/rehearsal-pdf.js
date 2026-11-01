import { personalizeEvent } from '../../../modules/intranet/personalEvent.js';
import { intranetAuth } from '../../../modules/intranet/auth.js';
import { rehearsalPdf } from '../../../modules/intranet/rehearsalPdf.js';
import { memberFor } from '../../../modules/intranet/members.js';
import { jsonResponse } from '../../../services/serverAuth.js';
export const prerender=false;
export async function POST({request}) {
 try {
  if(Number(request.headers.get('content-length'))>100000)return jsonResponse({error:'El plan es demasiado extenso.'},413);
  const raw=await request.text();if(raw.length>100000)return jsonResponse({error:'El plan es demasiado extenso.'},413);
  const input=JSON.parse(raw);
  const preview=import.meta.env.DEV && input.preview===true;
  const auth=preview?{role:['evento','tenida'].includes(input.kind)?'jefatura':'director',user:{email:'Demostración local'}}:await intranetAuth(request);
  if(!auth)return jsonResponse({error:'Acceso no autorizado.'},401);
  let plan;
  if(input.entryId&&!preview){
   const {data,error}=await auth.client.from('intranet_entries').select('*').eq('id',input.entryId).single();
   if(error||!data)return jsonResponse({error:'No se encontró un aviso accesible.'},404);
   plan={...data,music:data.rehearsal?.music||[],author:data.author_email};
   if(['evento','tenida'].includes(data.kind)){
    plan=await personalizeEvent(auth,plan);
   }
  } else {
   if(!['director','jefatura'].includes(auth.role))return jsonResponse({error:'Solo dirección musical o jefatura pueden preparar planes.'},403);
   if(['evento','tenida'].includes(input.kind)&&auth.role!=='jefatura')return jsonResponse({error:'Solo jefatura puede preparar la ficha de evento.'},403);
   plan={kind:input.kind,title:String(input.title||'Plan musical').slice(0,200),body:String(input.body||'').slice(0,20000),starts_at:input.starts_at||null,location:String(input.location||'').slice(0,300),recipients:Array.isArray(input.recipients)?input.recipients.filter(v=>typeof v==='string').slice(0,7):[],music:input.music,internal_work:String(input.internal_work||'').slice(0,10000),author:auth.user.email,event_details:input.event_details||{},outfit_text:String(input.outfit_text||'').slice(0,1000),checklist:Array.isArray(input.checklist)?input.checklist.slice(0,50):[],completed:preview&&Array.isArray(input.completed)?input.completed:[],personal_checklist:preview&&Array.isArray(input.personal_checklist)?input.personal_checklist.slice(0,50):[],member_email:memberFor(input.member_email)?input.member_email:auth.user.email,payment_amount:input.payment_amount!=null&&Number.isSafeInteger(input.payment_amount)&&input.payment_amount>=0&&input.payment_amount<=100000000?input.payment_amount:null};
  }
  const bytes=await rehearsalPdf(plan);
  return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="plan-musical-banda-bruna.pdf"','Cache-Control':'private, no-store'}});
 } catch(error){return jsonResponse({error:error.message||'No se pudo generar el PDF.'},400);}
}
