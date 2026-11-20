// Descargar el archivo como adjunto local evita depender de cómo el navegador
// gestione una navegación a un MP3 alojado en otro dominio.
export function setupAudioDownloads(root,report){
 root.addEventListener('click',async event=>{
  const link=event.target.closest?.('a[data-download-audio]');if(!link)return;
  event.preventDefault();if(link.getAttribute('aria-busy')==='true')return;
  const original=link.textContent;link.setAttribute('aria-busy','true');link.textContent='Preparando descarga…';
  try{
   const url=new URL(link.dataset.downloadAudio);
   if(url.origin!=='https://res.cloudinary.com'||!url.pathname.startsWith('/dhgifjpkh/video/upload/'))throw new Error('Audio inválido.');
   const response=await fetch(url.href);
   if(!response.ok)throw new Error(`El servidor respondió ${response.status}.`);
   const blob=await response.blob();if(!blob.size)throw new Error('El archivo está vacío.');
   const objectUrl=URL.createObjectURL(blob),save=document.createElement('a');
   save.href=objectUrl;save.download=(link.dataset.audioName||'Banda Bruna').replace(/[\\/:*?"<>|]/g,'-')+'.mp3';document.body.append(save);save.click();save.remove();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);report('Descarga iniciada. Revisa las descargas de tu navegador.');
  }catch(error){report('No se pudo descargar el audio. '+error.message+' Puedes usar Escuchar para abrirlo.');}
  finally{link.removeAttribute('aria-busy');link.textContent=original;}
 });
}
