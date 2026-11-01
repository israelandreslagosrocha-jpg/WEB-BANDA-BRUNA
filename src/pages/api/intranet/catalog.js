import { intranetAuth } from '../../../modules/intranet/auth.js';
import { catalogue } from '../../../modules/intranet/catalog.js';
import { jsonResponse } from '../../../services/serverAuth.js';
export const prerender=false;
export async function GET({request}) {
 try {if(!await intranetAuth(request))return jsonResponse({error:'Acceso no autorizado.'},401);return jsonResponse(catalogue);}catch{return jsonResponse({error:'No se pudo cargar la biblioteca.'},503);}
}
