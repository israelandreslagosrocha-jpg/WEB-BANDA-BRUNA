import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { riderChannels, riderMonitors } from '../src/data/technicalRider.js';
import { lightingSummary } from './rider_lighting_data.js';

const C = {bg:'#141416', panel:'#202023', line:'#454549', white:'#f6f4f2', muted:'#bcbcc3', red:'#ef5157'};
const W=595.28, H=841.89, M=38, CW=W-2*M;
const internalNotes = 'Talkbacks (24/25), click (28) y guía (29): comunicación y referencia internas. Excluir del PA; coordinar envíos a retornos con dirección técnica.';
const micNotes = 'Se aceptan modelos equivalentes o superiores. Las alternativas indicadas se acuerdan con producción antes del montaje. Phantom sólo en la entrada que lo requiera según micrófono o D.I.; no alimentar receptores inalámbricos.';
const contact = 'contacto@bandabruna.cl | +56 9 9002 1689 / +56 9 7614 9408';

export async function generateRiderDocuments(ctx) {
  const lighting=lightingSummary(ctx.stageObjects,ctx.dbEffects);
  // Normalizar nombres para que la cantidad publicada no se pierda por mayúsculas.
  if(ctx.dbEffects.length){
    lighting.fxSummary={};
    for(const fx of ctx.dbEffects){const key=String(fx.nombre).toLowerCase();lighting.fxSummary[key]=(lighting.fxSummary[key]||0)+Number(fx.cantidad||0);}
  }
  // Agrupar luminarias con el mismo patch, conservando la cantidad total de la planta.
  const patchGroups = new Map();
  for (const obj of ctx.stageObjects) {
    const key = JSON.stringify([obj.nombre_etiqueta, obj.fixture?.nombre, obj.truss?.nombre, obj.universo_dmx, obj.canal_dmx, obj.modo]);
    const group = patchGroups.get(key);
    if (group) group.quantity++; else patchGroups.set(key, {...obj, quantity: 1});
  }
  const dmx = [...patchGroups.values()].sort((a,b)=>(a.universo_dmx||1)-(b.universo_dmx||1)||(a.canal_dmx||0)-(b.canal_dmx||0));
  const dmxSections=[];
  for(let i=0;i<dmx.length;i+=22)dmxSections.push({kind:'dmx',rows:dmx.slice(i,i+22),part:dmxSections.length+1});
  const sections=[{kind:'cover'},{kind:'patch'},{kind:'monitors'},{kind:'mainStage'},{kind:'backline'},{kind:'lighting'},...dmxSections,{kind:'secondaryStage'}];
  const jobs=[
    ['rider_tecnico_banda_bruna.pdf',sections],
    ['input_list_banda_bruna.pdf',sections.filter(s=>['patch','monitors'].includes(s.kind))],
    ['stage_plot_banda_bruna.pdf',sections.filter(s=>['mainStage','secondaryStage'].includes(s.kind))],
    ['planta_luces_banda_bruna.pdf',sections.filter(s=>['lighting','dmx'].includes(s.kind))]
  ];
  for(const [name,pages] of jobs) await writeDoc(name,pages);
  fs.copyFileSync(path.join(ctx.downloadsDir,'stage_plot_banda_bruna.pdf'),path.join(ctx.downloadsDir,'stageplot_banda_bruna.pdf'));
  console.log('Ficha completa y descargas parciales sincronizadas.');

  async function writeDoc(name,pages){
    const doc=new PDFDocument({size:'A4',margin:M,autoFirstPage:false,info:{Title:name.startsWith('rider_')?'Ficha técnica completa Banda Bruna 2026-27':'Banda Bruna - Producción técnica 2026-27',Author:'Banda Bruna',Subject:'Patch, monitoreo, stage plot, backline e iluminación'}});
    const dest=fs.createWriteStream(path.join(ctx.downloadsDir,name));doc.pipe(dest);
    const done=new Promise((resolve,reject)=>{dest.on('finish',resolve);dest.on('error',reject);doc.on('error',reject);});
    let y=0;
    function text(t,x,yy,width,size=9,color=C.white,bold=false){doc.fillColor(color).font(bold?'Helvetica-Bold':'Helvetica').fontSize(size).text(t,x,yy,{width,lineGap:2});return doc.y;}
    function para(t,size=9,color=C.muted){y=text(t,M,y,CW,size,color)+10;}
    function title(t){y=text(t,M,y,CW,12,C.red,true)+10;}
    function box(t){doc.font('Helvetica').fontSize(8.5);const h=doc.heightOfString(t,{width:CW-22,lineGap:2})+20;doc.rect(M,y,CW,h).fill(C.panel);text(t,M+11,y+10,CW-22,8.5);y+=h+13;}
    function table(headers,rows,widths,size=8){
      doc.font('Helvetica-Bold').fontSize(size);
      const headerH=Math.max(25,...headers.map((h,i)=>doc.heightOfString(h,{width:widths[i]-14,lineGap:2})+14));
      doc.rect(M,y,CW,headerH).fill(C.red);let x=M;headers.forEach((h,i)=>{text(h,x+7,y+7,widths[i]-14,size,C.white,true);x+=widths[i];});y+=headerH;
      rows.forEach((row,idx)=>{
        doc.font('Helvetica').fontSize(size);
        const h=Math.max(size<=7.6?18:23,...row.map((v,i)=>doc.heightOfString(String(v??''),{width:widths[i]-14,lineGap:2})+(size<=7.6?8:14)));
        if(y+h>765)throw Error(`Tabla excede página en ${name}: fila ${idx+1} (${y+h})`);
        doc.rect(M,y,CW,h).fill(idx%2?C.panel:C.bg);x=M;
        row.forEach((v,i)=>{text(String(v??''),x+7,y+(size<=7.6?4:7),widths[i]-14,size,i===0?C.red:C.white,i===0);x+=widths[i];});
        doc.moveTo(M,y+h).lineTo(W-M,y+h).strokeColor(C.line).lineWidth(.35).stroke();y+=h;
      });y+=13;
    }
    function stage(main){
      para(main?'Montaje principal actualmente utilizado: teclados de lado mirando al centro de la banda. Esta es la planta utilizada e incluida en la ficha técnica oficial.':'Alternativa secundaria con teclados atrás. No es el montaje en uso; requiere coordinación y aprobación previa de dirección técnica.');
      const img=path.join(ctx.projectRoot,'public/assets/images/rider',main?'stage_plot_2.png':'stage_plot_1.png');
      doc.image(img,M,y,{fit:[CW,292],align:'center'});y+=305;
      if(main){
        table(['Músico','Instrumento / función','Retorno'],[
          ['César Bruna','Voz principal','Aux 7 / Bodypack'],['Fabián Garrido','Güiro / animación','Aux 3 / Bodypack'],['Vicente Núñez','Guitarra / dirección / coros','Aux 5 / Bodypack'],['Gerson Ulloa','Bajo / coros','Aux 4 + 9 piso'],['Israel Lagos Rocha','Teclados (posición lateral)','Aux 6 / Bodypack'],['Jaime Cárdenas Quilodrán','Batería / timbales / Octapad','Aux 1 XLR + 8 piso'],['Jaime Cárdenas Sanhueza','Congas / bongó / percusión','Aux 2 XLR']
        ],[190,205,CW-395],8);
      }
      box('Escenario mínimo: 10 m de boca x 8 m de fondo x 1,2 m de altura. Tarimas de batería y congas: 2 x 2 m, altura 40 cm, con alfombra antideslizante. 4 puntos dobles de 220 V estabilizada: batería, teclados, guitarra y bajo. Para escenarios menores, consultar con dirección técnica.');
      if(!main)para('Se mantienen el patch de 29 entradas y los 9 destinos de retorno. Confirmar recorridos de cable y accesos cuando se utilice esta alternativa.');
    }
    for(let index=0;index<pages.length;index++){
      const section=pages[index];doc.addPage();doc.rect(0,0,W,H).fill(C.bg);
      doc.rect(M,31,28,3).fill(C.red);
      text('BANDA BRUNA / TEMPORADA 2026-27',M+38,27,CW-38,8,C.muted,true);
      const titles={cover:'FICHA TÉCNICA COMPLETA',patch:'INPUT LIST / 29 CANALES',monitors:'MONITOREO / 9 SALIDAS',mainStage:'STAGE PLOT / MONTAJE EN USO',secondaryStage:'STAGE PLOT / ALTERNATIVA',backline:'BACKLINE / REQUERIMIENTOS',lighting:'ILUMINACIÓN / INFRAESTRUCTURA',dmx:`PATCH DMX / PARTE ${section.part}`};
      y=text(titles[section.kind],M,56,CW,19,C.white,true)+20;
      if(section.kind==='cover'){
        if(ctx.logoPath){doc.image(ctx.logoPath,M,110,{fit:[CW,110],align:'center'});y=244;}
        text('29 ENTRADAS    /    9 RETORNOS    /    CONSOLA PROPIA',M,y,CW,10,C.red,true);y+=30;
        title('ALLEN & HEATH Qu-7D');
        para('Banda Bruna cuenta con su propia consola digital Allen & Heath Qu-7D. Se solicita a la productora considerar su uso durante la presentación. 32 entradas Mic/Line, núcleo XCVI a 96 kHz y Dante integrado 16x16. El enlace con sala y el patch físico se coordinan antes del evento.');
        title('MICROFONÍA, BODYPACKS Y ATRILES');
        para('Se solicita la microfonía indicada o equipos de características similares o superiores. Se requieren cinco sistemas de retorno inalámbrico tipo bodypack Shure o Sennheiser y un total de nueve atriles de micrófono K&M o similares.');
        para('Si la productora no dispone de todos los equipos solicitados, la banda cuenta con microfonía y bodypacks propios que podrán utilizarse previa coordinación y según disponibilidad. Confirmar quién aporta cada equipo y las frecuencias de trabajo.');
        box('PLANTA PRINCIPAL: TECLADOS DE LADO\nLa planta lateral es el montaje actualmente utilizado. El plano con teclados atrás se conserva únicamente como alternativa secundaria, sujeta a coordinación.');
        title('CONTENIDO DEL DOCUMENTO');
        para('Patch por músico y fuente · Microfonía y cajas directas · Monitoreo · Planta principal · Backline · Escenario y electricidad · Iluminación y efectos · Patch DMX · Planta alternativa.',9);
        para(`DIRECCIÓN TÉCNICA\n${contact}\nwww.bandabruna.cl/produccion · Temuco, Chile`,10,C.white);
      }else if(section.kind==='patch'){
        para('Orden oficial conservado por músico y fuente. Los nombres de los canales son los utilizados en la consola.',8);
        table(['N°','Instrumento / músico','Micrófono / conexión'],riderChannels.map(c=>[c.canal,c.instrumento,c.conexion]),[30,151,CW-181],7.6);
        para('Clamps LP: Ch 3, 4, 9 y 10; Ch 11 si se utiliza E604. Secuencias L/R, click y guía requieren cuatro cajas directas; teclados, dos; Octapad, una.',8);
        para(micNotes,8);
      }else if(section.kind==='monitors'){
        para('Se mantienen los destinos y la numeración del show. Son dos retornos cableados, cinco bodypacks y dos monitores de piso.',9);
        table(['Aux','Destino','Sistema'],riderMonitors.map(m=>[m.mezcla,m.destino,m.tipo+' / '+m.salida]),[52,160,CW-212],9);
        title('REQUERIMIENTOS DE RETORNO');
        para('Aux 1 / Batería: Jaime Cárdenas Quilodrán. Aux 2 / Congas: Jaime Cárdenas Sanhueza. Líneas XLR hacia amplificadores de audífonos; coordinar su provisión.');
        para('Aux 3 / Fabián Garrido; Aux 4 / Gerson Ulloa; Aux 5 / Vicente Núñez; Aux 6 / Israel Lagos Rocha; Aux 7 / César Bruna: cinco bodypacks Shure o Sennheiser. Coordinar frecuencias libres y modo mono/estéreo. La numeración identifica destinos; la asignación física se confirma en consola.');
        para('Aux 8 y Aux 9: dos monitores de piso activos de 12 o 15 pulgadas, para batería y bajo respectivamente. Verificar fase, ecualización y ausencia de acoples.');
        box(internalNotes);
        para('Rotular ambos extremos de las líneas. Mantener separadas las referencias internas del envío de sala. Confirmar balances de cada músico durante el line check.');
      }else if(section.kind==='mainStage'||section.kind==='secondaryStage')stage(section.kind==='mainStage');
      else if(section.kind==='backline'){
        para('La banda viaja con sus instrumentos principales. Confirmar con producción la provisión del backline y la disponibilidad de equipos propios.');
        for(const inst of ctx.backline){
          title(inst.name.toUpperCase());
          para(inst.defaultItems.join(' · '),8.5,C.white);
          para('Referencia: '+inst.rec,8,C.muted);y+=2;
        }
        box('9 atriles de micrófono K&M o equivalentes. Los clamps de percusión se consideran aparte. Confirmar ubicación de cada atril y alimentación de cada puesto antes del montaje.');
      }else if(section.kind==='lighting'){
        para(`Configuración: ${ctx.layoutName}. Equipamiento y distribución consolidados de la planta de iluminación de producción.`,8.5);
        title('LUMINARIAS');
        table(['Equipo','Marca / modelo','W','DMX','Cant.'],lighting.fixtureList.map(f=>[f.nombre,f.modelo,f.potencia,f.dmx,f.cant]),[145,155,57,95,CW-452],7.6);
        title('ESTRUCTURAS Y DISTRIBUCIÓN');
        table(['Estructura','Distribución','Cant.'],lighting.trussList.map(t=>[t.truss,t.detail,t.cant]),[130,CW-180,50],7.6);
        title('EFECTOS ESPECIALES');
        const fx=Object.entries(lighting.fxSummary).map(([name,count])=>`${name.toUpperCase()}: ${count} unidad(es)`).join(' · ');
        para(fx,9,C.white);
        for(const name of [...new Set(ctx.dbEffects.map(f=>f.nombre))]){
          const desc=ctx.dbEffects.find(f=>f.nombre===name)?.descripcion;if(desc)para(`${name}: ${desc}`,8);
        }
        box('Alimentación de iluminación: trifásica de 380 V, tierra dedicada y potencia mínima de 30 kW para el montaje completo. Distribución mediante splitters DMX activos. Mantener la alimentación de audio y escenario diferenciada de la de iluminación.');
        para('Los detalles de universo y dirección inicial se incluyen en las páginas de patch DMX. La operación y las condiciones de uso de los efectos se coordinan con la producción del recinto.',8);
      }else if(section.kind==='dmx'){
        para('Direcciones iniciales y modos de la planta configurada. Las luminarias con el mismo patch se agrupan indicando su cantidad. Confirmar asignación, universos y conexiones antes de operar.',8.5);
        table(['Equipo / etiqueta','Estructura','Univ.','Inicio','Modo','Cant.'],section.rows.map(o=>[o.nombre_etiqueta||o.fixture?.nombre||'Luminaria',o.truss?.nombre||'Piso',o.universo_dmx??'Por confirmar',o.canal_dmx??'Por confirmar',o.modo||'Por confirmar',o.quantity]),[145,130,45,45,99,CW-464],7.8);
      }
      if(y>780)throw Error(`Contenido fuera de página en ${name}: ${section.kind} (${y})`);
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.moveTo(M,795).lineTo(W-M,795).strokeColor(C.line).lineWidth(.5).stroke();
      text('BANDA BRUNA · '+contact,M,804,CW-65,6.4,C.muted);
      text(`${index+1} / ${pages.length}`,W-M-44,804,44,8,C.muted);
      doc.page.margins.bottom = bottomMargin;
    }
    doc.end();await done;
    console.log(`Generado ${name}: ${pages.length} páginas.`);
  }
}
