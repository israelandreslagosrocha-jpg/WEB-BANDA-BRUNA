import { intranetAuth } from '../../../modules/intranet/auth.js';
import { validateMusic } from '../../../modules/intranet/catalog.js';
import { directorEmail } from '../../../modules/intranet/workflow.js';
import { jsonResponse } from '../../../services/serverAuth.js';
export const prerender=false;
export async function GET({request}){
 try{const auth=await intranetAuth(request);if(!auth)return jsonResponse({error:'Acceso no autorizado.'},401);
 const {data,error}=await auth.client.from('intranet_musical_plans').select('*');if(error)throw error;return jsonResponse({plans:data||[]});
 }catch{return jsonResponse({error:'No se pudieron cargar los setlists del director musical.'},503);}
}
export async function POST({request}){
 try{const auth=await intranetAuth(request);if(!auth)return jsonResponse({error:'Acceso no autorizado.'},401);
 if(auth.user.email?.toLowerCase()!==directorEmail||auth.role!=='director')return jsonResponse({error:'Solo Vicente puede proporcionar u ordenar el setlist.'},403);
 const raw=await request.text();if(raw.length>100000)return jsonResponse({error:'Plan demasiado extenso.'},413);
 const input=JSON.parse(raw);const music=validateMusic(input.music);const notes=String(input.general_notes||'');if(notes.length>10000)throw new Error('Las indicaciones son demasiado extensas.');
 const {data,error}=await auth.client.rpc('save_intranet_musical_plan',{target:String(input.target||''),selected_music:music,notes});if(error)throw error;return jsonResponse({ok:true,id:data});
 }catch(error){return jsonResponse({error:error.message||'No se pudo guardar el setlist.'},400);}
}
