import fs from 'node:fs/promises';
const file=new URL('../src/modules/intranet/repertoire.json',import.meta.url);
const catalogue=JSON.parse(await fs.readFile(file,'utf8'));
const assetsFile=new URL('../src/modules/intranet/audio-assets.json',import.meta.url);
const assets=JSON.parse(await fs.readFile(assetsFile,'utf8'));
for(let i=0;i<assets.length;i+=5) {
 await Promise.all(assets.slice(i,i+5).map(async audio=>{
  try {const response=await fetch(new URL(audio.url),{method:'HEAD',signal:AbortSignal.timeout(45000)});audio.verified=response.ok&&/audio\/(mpeg|mp3)/i.test(response.headers.get('content-type')||'');audio.httpStatus=response.status;audio.checkedAt=new Date().toISOString();}
  catch(error){audio.verified=false;audio.checkError=error.message;}
  console.log(`${audio.verified?'OK':'PENDIENTE'} ${audio.publicId} ${audio.httpStatus||''}`);
 }));
}
for(const item of catalogue.items)if(item.audio)item.audio=assets.find(a=>a.publicId===item.audio.publicId);
await fs.writeFile(file,JSON.stringify(catalogue,null,2)+'\n');
await fs.writeFile(assetsFile,JSON.stringify(assets,null,2)+'\n');
console.log(`${assets.filter(a=>a.verified).length}/${assets.length} MP3 verificados`);
