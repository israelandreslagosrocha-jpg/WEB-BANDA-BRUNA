// Convierte la hora civil de Santiago sin depender de la zona horaria del dispositivo.
export function chileISO(value) {
 const target = new Date(value+'Z').getTime(); let instant = target;
 for(let i=0;i<3;i++) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map(v=>[v.type,v.value]));
  const local = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
  instant += target-local;
 }
 const result = new Date(instant).toISOString();
 const parts = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(instant)).replace(' ','T');
 if(parts!==value) throw new Error('Esta hora no existe por el cambio de horario en Chile. Selecciona otra hora.');
 return result;
}
