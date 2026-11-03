import { catalogue } from './catalog';
import { members } from './members';
// Solo se carga en desarrollo. Todo el contenido y los cambios viven en memoria.
export function createPreview() {
 const role = new URLSearchParams(location.search).get('demo');
 const member = members.find(m=>m[2]===role) || members[0];
 const user = {id:'preview-user',email:member[0]};
 const base = {revision:1,author:'preview-author',created_at:'2026-11-01T15:00:00Z',recipients:[],starts_at:null,location:'',outfit_text:'',mix_mode:'',checklist:[],rehearsal:{},file_path:null};
 const tables: Record<string,any[]> = {
  intranet_entries:[
   {...base,id:'preview-show',kind:'tenida',author_email:'cesarbruna@bandabruna.cl',title:'Próximo show · Tenida y preparativos',event_details:{departure_at:'2026-11-07T18:00:00Z',meeting_point:'Punto de encuentro de ejemplo',outfit_slug:'noche-plata'},rehearsal:{music:[{id:'viking-1',purpose:'show',mode:'secuencia',notes:'Abrir el bloque con la intro.'},{id:'antonio-rios',purpose:'show',mode:'bruto',notes:'Solo las tres canciones del catálogo.'}]},body:'Ejemplo de aviso para el equipo. Nos reuniremos antes de la prueba de sonido. Revisen sus equipos y confirmen que tienen todo preparado.',starts_at:'2026-11-07T22:00:00Z',location:'Evento de demostración · Temuco',outfit_text:'Noche Plata · Pantalón negro, camisa negra, bolero gris y zapatos de charol',checklist:['Llevar body cargado','Llevar audífonos para in ear','No olvidar alargadores y enchufes','Llevar snack: evento sin amenities','Considerar 2 horas de viaje']},
   {...base,id:'preview-rehearsal',kind:'ensayo',author_email:'vicentenunez@bandabruna.cl',title:'Plan del próximo ensayo',body:'Revisaremos entradas, cortes y transiciones. Escuchar el material antes de llegar.',starts_at:'2026-11-04T23:00:00Z',location:'Sala de ensayo · Ejemplo',mix_mode:'mixto',rehearsal:{music:[{id:'viking-1',purpose:'ensayo',mode:'por-confirmar',notes:'Revisar entradas y cortes. Tonalidades según el catálogo.'},{id:'antonio-rios',purpose:'nuevo',mode:'bruto',notes:'Ensayar únicamente las tres canciones indicadas.'}],internal_work:'Voces con Jaime Jr. y Gerson; base rítmica con el equipo.',next_rehearsal:'Mix tropical · entradas y cortes\nBloque de cumbia · transiciones',show_setlist:'Apertura → Mix tropical → Bloque de cumbia → Cierre',new_songs:'Tema nuevo A y tema nuevo B (ejemplos)'},checklist:['Escuchar las referencias','Revisar los cortes del mix']},
   {...base,id:'preview-meeting',kind:'evento',author_email:'jaimecardenas@bandabruna.cl',title:'Junta de planificación de verano',starts_at:'2026-11-12T22:00:00Z',location:'Sala de reunión · Ejemplo',event_details:{category:'junta',status:'confirmado'},body:'Coordinar próximas fechas y logística.'},
   {...base,id:'preview-budget',kind:'evento',author_email:'cesarbruna@bandabruna.cl',title:'Festival de verano · fecha tentativa',starts_at:'2026-11-21T23:00:00Z',location:'Recinto por confirmar',event_details:{category:'especial',status:'presupuestado'},body:'Ejemplo de una fecha presupuestada, pendiente de confirmación.'},
   {...base,id:'preview-private',kind:'personal',author_email:'vicentenunez@bandabruna.cl',title:'Tu trabajo personal para esta semana',body:'Practicar el mix tropical con metrónomo. Repetir la transición al segundo tema y cuidar la entrada después del corte.\n\nEste es un ejemplo ficticio de una indicación privada.',recipients:[user.email],mix_mode:'secuencia'},
   {...base,id:'preview-material',kind:'repertorio',author_email:'vicentenunez@bandabruna.cl',title:'Repertorio para revisar',body:'Material de demostración para visualizar cómo se presenta un archivo descargable.',file_path:'preview/repertorio.txt',file_name:'Repertorio de ejemplo.txt',file_mime:'text/plain'},
   {...base,id:'preview-notice',kind:'comunicado',author_email:'jaimecardenas@bandabruna.cl',title:'Información importante del equipo',body:'Revisen la agenda y las indicaciones antes de cada salida. Los avisos nuevos aparecerán aquí y podrán marcarlos como leídos.'},
  ],intranet_receipts:[],intranet_event_payments:[{entry_id:'preview-show',member_email:user.email,amount_clp:50000}],intranet_outfits:[{id:'outfit-black',name:'Negro + chaqueta de la banda',description:'Pantalón y calzado negros; chaqueta oficial'},{id:'outfit-white',name:'Camisa blanca',description:'Camisa blanca y pantalón negro · ejemplo'}]
 };
 const banner=document.createElement('section');banner.style.cssText='padding:16px;border:1px solid #d8b36a;border-radius:12px;margin-bottom:24px;background:#242115';
 banner.innerHTML='<strong>Previsualización · datos de ejemplo</strong><p>No envía avisos ni modifica Supabase. Los cambios se reinician al recargar.</p><a href="?demo=miembro">Ver integrante</a> <a href="?demo=jefatura">Ver Jaime / César</a> <a href="?demo=director">Ver director musical</a>';
 document.querySelector('.intranet')!.prepend(banner);
 return {
  previewCatalogue: catalogue,
  previewOfficialEvents:[{id:'official-demo',nombre:'Show oficial de la banda · ejemplo',fecha:'2026-11-28',lugar:'Teatro de ejemplo',ciudad:'Temuco',publicado:true}],
  auth:{getUser:async()=>({data:{user},error:null}),signOut:async()=>({error:null})},
  rpc:async(name:string,args:any)=>{const id=crypto.randomUUID();if(name==='update_intranet_event'){if(member[2]!=='jefatura')return {data:null,error:{message:'Solo Jaime y César pueden editar eventos.'}};const row=tables.intranet_entries.find(e=>e.id===args.target_id);if(!row||row.revision!==args.expected_revision)return {data:null,error:{message:'La ficha cambió. Actualiza antes de guardar.'}};const author=row.author_email,kind=row.kind,rehearsal=row.rehearsal;Object.assign(row,args.payload,{author_email:author,kind,rehearsal,revision:row.revision+1});tables.intranet_event_payments=tables.intranet_event_payments.filter(p=>p.entry_id!==row.id);tables.intranet_event_payments.push(...args.payments.map((p:any)=>({...p,entry_id:row.id})));tables.intranet_entries.unshift({...base,id:crypto.randomUUID(),kind:'comunicado',title:'Evento actualizado · '+row.title,body:'Jefatura actualizó la ficha del evento.',recipients:row.recipients,event_context:row.event_details?.official_event_id?'official:'+row.event_details.official_event_id:'entry:'+row.id,author_email:user.email});return {data:row.id,error:null};}if(name==='save_intranet_musical_plan'){if(member[2]!=='director')return {data:null,error:{message:'Solo Vicente puede editar el setlist.'}};const rows=tables.intranet_musical_plans||=[];const index=rows.findIndex(p=>p.target_key===args.target);const plan={id:index<0?id:rows[index].id,target_key:args.target,music:args.music,general_notes:args.general_notes,author_email:user.email,updated_at:new Date().toISOString()};if(index<0)rows.push(plan);else rows[index]=plan;tables.intranet_entries.unshift({...base,id:crypto.randomUUID(),kind:'comunicado',title:'Dirección musical · setlist actualizado',body:'Vicente actualizó el setlist de una ficha.',author_email:user.email});return {data:plan.id,error:null};}tables.intranet_entries.unshift({...base,...args.payload,id,author_email:user.email});tables.intranet_event_payments.push(...args.payments.map((p:any)=>({...p,entry_id:id})));return {data:id,error:null};},
  from(table:string) {
   let mode='select',payload:any,field:string|undefined,value:any;
   const query:any={
    select(){return query;},order(){return query;},eq(key:string,v:any){field=key;value=v;return query;},
    insert(v:any){mode='insert';payload=v;return query;},upsert(v:any){mode='upsert';payload=v;return query;},
    then(resolve:any,reject:any){
     return Promise.resolve().then(()=>{
      const rows=tables[table] ||= [];
      if(mode==='insert'){rows.unshift({ ...base,id:crypto.randomUUID(),author_email:user.email,...payload });return {data:null,error:null};}
      if(mode==='upsert'){const i=rows.findIndex(r=>r.entry_id===payload.entry_id&&r.user_id===payload.user_id);if(i<0)rows.push(payload);else rows[i]=payload;return {data:null,error:null};}
      return {data:rows.filter(r=>!field||r[field]===value),error:null};
     }).then(resolve,reject);
    }
   }; return query;
  },
  storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:URL.createObjectURL(new Blob(['Repertorio de ejemplo\n1. Apertura\n2. Mix tropical\n3. Cierre'],{type:'text/plain'}))},error:null}),upload:async()=>({data:null,error:{message:'La previsualización no sube archivos. Puedes probar los demás campos.'}}),remove:async()=>({error:null})})}
 };
}
