import { musicTarget,complementMusic } from './workflow.js';
export async function complementPublishedPlan(auth,entry){
 if(!['evento','tenida','ensayo'].includes(entry.kind))return entry;
 const {data,error}=await auth.client.from('intranet_musical_plans').select('*').eq('target_key',musicTarget(entry)).maybeSingle();
 if(error)throw new Error('No se pudo verificar el setlist de Vicente.');
 return complementMusic([entry],data?[data]:[])[0];
}
