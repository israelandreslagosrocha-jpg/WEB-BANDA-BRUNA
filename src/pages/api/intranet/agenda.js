import { intranetAuth } from '../../../modules/intranet/auth.js';
import { jsonResponse } from '../../../services/serverAuth.js';
export const prerender=false;
export async function GET({request}){
 try{
  const auth=await intranetAuth(request);if(!auth)return jsonResponse({error:'Acceso no autorizado.'},401);
  const {data,error}=await auth.client.from('eventos').select('id,nombre,fecha,lugar,ciudad,publicado').eq('publicado',true).order('fecha',{ascending:true});
  if(error)throw error;
  return jsonResponse({events:data||[]});
 }catch{return jsonResponse({error:'No se pudo actualizar la agenda oficial de la banda.'},503);}
}
