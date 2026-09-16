import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const downloadsDir = path.join(projectRoot, 'public', 'assets', 'downloads');
const logosDir = path.join(projectRoot, 'public', 'assets', 'images', 'logos');

// Asegurar que las carpetas existen
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

// 1. LEER ARCHIVO .ENV PARA EXTRAER CREDENCIALES DE SUPABASE
const envPath = path.join(projectRoot, '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      envVars[key] = value.trim();
    }
  });
}

const supabaseUrl = envVars.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.PUBLIC_SUPABASE_ANON_KEY;

// Paleta de Colores Corporativa
const COLOR_PRIMARY = '#020617';   // Azul muy oscuro
const COLOR_GOLD = '#d4af37';      // Oro metálico
const COLOR_GOLD_LIGHT = '#fdf6e2'; // Oro muy claro
const COLOR_TEXT = '#1e293b';      // Gris oscuro
const COLOR_MUTED = '#64748b';     // Gris medio
const COLOR_BORDER = '#e2e8f0';    // Gris de bordes
const COLOR_LIGHT_BG = '#f8fafc';   // Gris de filas

// Función para descargar y convertir el logo oficial de la banda
async function getOfficialLogo() {
  const logoUrl = 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892643/compressed_Logo_npwoef.webp';
  const webpPath = path.join(logosDir, 'logo_official.webp');
  const pngPath = path.join(logosDir, 'logo_official.png');

  if (fs.existsSync(pngPath)) {
    return pngPath;
  }

  try {
    console.log('Descargando logo oficial de Cloudinary...');
    const response = await fetch(logoUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(webpPath, Buffer.from(arrayBuffer));

    console.log('Convirtiendo logo oficial a PNG con sharp...');
    await sharp(webpPath).png().toFile(pngPath);
    console.log('Logo oficial PNG listo para PDFKit.');
    return pngPath;
  } catch (err) {
    console.error('Error al descargar/convertir el logo oficial:', err.message);
    return null;
  }
}

// Función para dibujar la cabecera profesional
function drawHeader(doc, title, subtitle, logoPath) {
  // Banner superior oscuro
  doc.rect(40, 40, 515, 65).fill(COLOR_PRIMARY);

  // Logo Oficial a la izquierda
  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 48, { height: 48 });
  } else {
    // Texto de respaldo si no hay imagen de logo
    doc.fillColor(COLOR_GOLD).fontSize(18).font('Helvetica-Bold').text('BANDA BRUNA', 60, 52);
    doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica').text('CUMBIA SUREÑA & SHOW PROFESIONAL', 60, 75);
  }

  // Título a la derecha
  doc.fillColor(COLOR_GOLD)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text(title.toUpperCase(), 280, 54, { width: 255, align: 'right' });

  // Subtítulo
  doc.fillColor('#94a3b8')
     .fontSize(8)
     .font('Helvetica')
     .text(subtitle, 280, 73, { width: 255, align: 'right' });

  // Línea dorada divisoria
  doc.rect(40, 105, 515, 3).fill(COLOR_GOLD);
}

// Función para dibujar el pie de página
function drawFooter(doc, pageNum, totalPages = 1) {
  doc.rect(40, 765, 515, 1).fill(COLOR_BORDER);
  doc.fillColor(COLOR_MUTED).fontSize(7).font('Helvetica').text('Portal de Producción Técnica v2.0 - Banda Bruna • contacto@bandabruna.cl • Temuco, Chile', 40, 772, { width: 400 });
  doc.text(totalPages > 1 ? `Página ${pageNum} de ${totalPages}` : `Página ${pageNum}`, 440, 772, { width: 115, align: 'right' });
}

// =====================================================================
// 1. GENERAR: INPUT LIST PDF (SOUNDCRAFT Ui24R & 8 AUXILIARES)
// =====================================================================
function generateInputListPDF(canales, layoutName, logoPath) {
  const pdfPath = path.join(downloadsDir, 'input_list_banda_bruna.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(pdfPath));

  // ----------------------------------------------------
  // PÁGINA 1: PATCH DE CANALES AUDIO (FOH / SALA)
  // ----------------------------------------------------
  drawHeader(doc, 'Input List & Patch de Canales', 'Soundcraft Ui24R • Ficha Oficial', logoPath);

  // 1. Aviso de Consola Propia y Flexibilidad
  const noticeY = 114;
  doc.rect(40, noticeY, 515, 30).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7.5).text('CONSOLA DIGITAL PROPIA EN GIRA: SOUNDCRAFT Ui24R', 48, noticeY + 5);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(6.8).text(
    'Banda Bruna viaja con su propia consola Soundcraft Ui24R (escenas y monitores preconfigurados para Line Check ágil de 10-15 min).\nSe solicita contar con la microfonía indicada o modelos de características similares o superior, según disponibilidad de la producción.',
    48, noticeY + 15, { lineGap: 1.5 }
  );

  // 2. Tabla Canales (Patch 1-26)
  let currentY = 148;
  const colWidths = [28, 145, 232, 110];
  const colTitles = ['N°', 'Instrumento / Fuente', 'Micrófono / Conexión sugerida', 'Categoría'];

  // Cabecera de la Tabla
  doc.rect(40, currentY, 515, 16).fill(COLOR_PRIMARY);
  let currentX = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  for (let i = 0; i < colTitles.length; i++) {
    doc.text(colTitles[i], currentX + 6, currentY + 4, { width: colWidths[i] - 12 });
    currentX += colWidths[i];
  }

  currentY += 16;
  doc.font('Helvetica').fontSize(7.2);

  canales.forEach((c, idx) => {
    const rowHeight = 15.2;
    if (idx % 2 === 1) {
      doc.rect(40, currentY, 515, rowHeight).fill(COLOR_LIGHT_BG);
    }
    
    doc.fillColor(COLOR_TEXT);
    let drawX = 40;
    
    // Canal
    doc.font('Helvetica-Bold');
    doc.text(c.canal.toString(), drawX + 6, currentY + 3.5, { width: colWidths[0] - 12, align: 'center' });
    drawX += colWidths[0];
    
    // Instrumento
    doc.font('Helvetica-Bold');
    doc.text(c.instrumento, drawX + 6, currentY + 3.5, { width: colWidths[1] - 12 });
    drawX += colWidths[1];
    
    // Conexión
    doc.font('Helvetica');
    doc.text(c.conexion, drawX + 6, currentY + 3.5, { width: colWidths[2] - 12 });
    drawX += colWidths[2];
    
    // Categoría
    doc.fillColor(COLOR_MUTED);
    doc.text(c.categoria, drawX + 6, currentY + 3.5, { width: colWidths[3] - 12 });
    
    doc.rect(40, currentY + rowHeight, 515, 0.5).fill(COLOR_BORDER);
    currentY += rowHeight;
  });

  // 3. Notas técnicas de microfonía y corriente
  const notesY = currentY + 7;
  doc.rect(40, notesY, 515, 38).fill(COLOR_GOLD_LIGHT).stroke(COLOR_GOLD);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7.2).text('NOTAS TÉCNICAS PARA FOH & PATCHERA:', 48, notesY + 5);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(6.8);
  doc.text('• Clamps LP: Canales 3, 4, 5, 11 y 12 utilizan montajes Clamp Claw LP (ahorra atriles en tarimas).', 48, notesY + 15);
  doc.text('• Líneas RCA & Phantom: Ch 21/22 corresponden a entradas RCA físicas. Phantom (+48V) requerido en Ch 5, 6, 14 y 19.', 48, notesY + 25);

  // 4. Pie de página web & redes
  const footerCardY = notesY + 44;
  doc.rect(40, footerCardY, 515, 24).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7.2).text('BANDA BRUNA:', 48, footerCardY + 5);
  doc.fillColor(COLOR_GOLD).font('Helvetica-Bold').fontSize(7.2).text('www.bandabruna.cl', 110, footerCardY + 5);
  doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(6.8).text('contacto@bandabruna.cl  •  +56 9 9002 1689 / +56 9 7614 9408  •  Temuco, Chile', 48, footerCardY + 14);

  drawFooter(doc, 1, 2);

  // ----------------------------------------------------
  // PÁGINA 2: LISTA DE MONITORES (8 ENVIOS AUXILIARES)
  // ----------------------------------------------------
  doc.addPage({ size: 'A4', margin: 40 });

  drawHeader(doc, 'Lista de Monitores & Retornos', '8 Salidas Auxiliares Soundcraft Ui24R', logoPath);

  // Subcabecera
  const subY = 114;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(8.5).text('SISTEMA DE MONITOREO OFICIAL (8 MEZCLAS INDEPENDIENTES):', 40, subY);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(7.5).text(
    'Configuración exacta de las 8 salidas auxiliares físicas de la consola Soundcraft Ui24R de Banda Bruna.', 
    40, subY + 11
  );

  // Resumen de Infraestructura
  const infraY = 138;
  doc.rect(40, infraY, 515, 32).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7.8).text('RESUMEN DE SALIDAS DE MONITOREO:', 48, infraY + 5);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(7).text(
    '• 3x Envíos In-Ear Cableados (XLR macho en escenario para Piano, Batería y Congas).\n• 3x Envíos In-Ear Inalámbricos UHF (Bodypacks para Vocal, Bajo y Guitarra/Güira) provistos por Banda Bruna.\n• 2x Monitores Wedge Activos de Piso (12" o 15") provistos por la productora (Piso Batería y Piso Bajo).',
    48, infraY + 15, { lineGap: 1.5 }
  );

  // Tabla Monitoreo (8 Auxiliares Exactos)
  let currentYM = 176;
  const colWidthsMix = [45, 110, 80, 110, 170];
  const colTitlesMix = ['Aux #', 'Destino / Músico', 'Tipo Salida', 'Sistema Retorno', 'Detalle de Mezcla'];

  doc.rect(40, currentYM, 515, 16).fill(COLOR_PRIMARY);
  let currentXM = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  for (let i = 0; i < colTitlesMix.length; i++) {
    doc.text(colTitlesMix[i], currentXM + 6, currentYM + 4, { width: colWidthsMix[i] - 12 });
    currentXM += colWidthsMix[i];
  }

  currentYM += 16;
  doc.font('Helvetica').fontSize(7.2);

  const monitorMixes = [
    { mix: 'Aux 1', member: 'PIANO (Israel Lagos)', out: 'XLR', type: 'In-Ear Cableado (XLR)', spec: 'Pianos, teclados L/R, secuencias estéreo, click y referencia.' },
    { mix: 'Aux 2', member: 'BATERIA (Jaime C. Q.)', out: 'XLR', type: 'In-Ear Cableado (XLR)', spec: 'Batería, click, guía, bajo y retorno de voces.' },
    { mix: 'Aux 3', member: 'CONGA (Jaime C. S.)', out: 'XLR', type: 'In-Ear Cableado (XLR)', spec: 'Percusión latina, timbal, base rítmica y coros.' },
    { mix: 'Aux 4', member: 'GUITAR - GÜIRA', out: 'BODYPACK', type: 'In-Ear Inalámbrico UHF', spec: 'Vicente N. & Fabián G.: Balance guitarra, animación, coros y secuencias.' },
    { mix: 'Aux 5', member: 'BASS (Gerson Ulloa)', out: 'BODYPACK', type: 'In-Ear Inalámbrico UHF', spec: 'Bajo al frente, bombo, timbales, armonía y click.' },
    { mix: 'Aux 6', member: 'VOCAL (César Bruna)', out: 'BODYPACK', type: 'In-Ear Inalámbrico UHF', spec: 'Voz principal al frente, reverb, teclados y secuencias.' },
    { mix: 'Aux 7', member: 'PISO BATERIA', out: 'XLR', type: 'Monitor Wedge (Piso)', spec: '1 Monitor Activo 12" o 15" para presión acústica y rítmica en tarima.' },
    { mix: 'Aux 8', member: 'PISO BASS', out: 'XLR', type: 'Monitor Wedge (Piso)', spec: '1 Monitor Activo 12" o 15" para referencia frontal de graves y armonía.' }
  ];

  monitorMixes.forEach((m, idx) => {
    const rowH = 19;
    if (idx % 2 === 1) {
      doc.rect(40, currentYM, 515, rowH).fill(COLOR_LIGHT_BG);
    }
    doc.fillColor(COLOR_TEXT);

    let drawX = 40;
    doc.font('Helvetica-Bold').text(m.mix, drawX + 6, currentYM + 5, { width: colWidthsMix[0] - 12, align: 'center' });
    drawX += colWidthsMix[0];

    doc.font('Helvetica-Bold').text(m.member, drawX + 6, currentYM + 5, { width: colWidthsMix[1] - 12 });
    drawX += colWidthsMix[1];

    doc.font('Helvetica-Bold').fillColor(m.out === 'BODYPACK' ? '#7e22ce' : '#0369a1').text(m.out, drawX + 6, currentYM + 5, { width: colWidthsMix[2] - 12 });
    drawX += colWidthsMix[2];

    doc.font('Helvetica').fillColor(COLOR_TEXT).text(m.type, drawX + 6, currentYM + 5, { width: colWidthsMix[3] - 12 });
    drawX += colWidthsMix[3];

    doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(6.8).text(m.spec, drawX + 6, currentYM + 3.5, { width: colWidthsMix[4] - 12, lineGap: 1.2 });

    doc.rect(40, currentYM + rowH, 515, 0.5).fill(COLOR_BORDER);
    currentYM += rowH;
  });

  // Requerimientos técnicos para sonidista de monitores
  const monReqY = currentYM + 10;
  doc.rect(40, monReqY, 515, 68).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7.5).text('DIRECTRICES DE CONEXIÓN EN ESCENARIO:', 48, monReqY + 6);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(6.8);
  doc.text('1. Envíos Cableados (Aux 1, 2, 3, 7, 8): Requieren líneas balanceadas XLR macho rotuladas en escenario.', 48, monReqY + 18);
  doc.text('2. Talkback (Canal 20): Asignado para intercomunicación interna entre músicos y el equipo técnico.', 48, monReqY + 28);
  doc.text('3. Monitores Wedge (Aux 7 y 8): Deben ser activos de 12" o 15", verificados en fase y ecualizados para evitar acoples.', 48, monReqY + 38);
  doc.text('4. Transmisores Bodypack (Aux 4, 5, 6): Operan en banda UHF; se solicita coordinar frecuencias libres con producción.', 48, monReqY + 48);

  // Tarjeta de contacto
  const contactCardY = monReqY + 76;
  doc.rect(40, contactCardY, 515, 24).fill(COLOR_GOLD_LIGHT).stroke(COLOR_GOLD);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7.2).text('DIRECCIÓN TÉCNICA OFICIAL:', 48, contactCardY + 5);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(6.8).text('contacto@bandabruna.cl  •  +56 9 9002 1689 / +56 9 7614 9408  •  www.bandabruna.cl', 48, contactCardY + 13);

  drawFooter(doc, 2, 2);
  doc.end();
}

// =====================================================================
// 2. GENERAR: PLANTA DE LUCES PDF
// =====================================================================
function generateLightingPDF(stageObjects, dbEffects, layoutName, logoPath) {
  const pdfPath = path.join(downloadsDir, 'planta_luces_banda_bruna.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(pdfPath));

  drawHeader(doc, 'Planta de Luces e Iluminación', `Ficha Oficial: ${layoutName}`, logoPath);

  // Procesar focos de base de datos o usar fallbacks si está vacío
  let fixtureList = [];
  let trussList = [];

  if (stageObjects.length > 0) {
    const counts = {};
    const trussSummary = {};

    stageObjects.forEach(obj => {
      const name = obj.fixture?.nombre || obj.nombre_etiqueta || 'Fixture';
      if (!counts[name]) {
        counts[name] = {
          nombre: name,
          tipo: obj.fixture?.tipo || 'Desconocido',
          modelo: `${obj.fixture?.marca || ''} ${obj.fixture?.modelo || ''}`.trim() || 'Genérico',
          potencia: obj.fixture?.potencia || 'N/A',
          dmx: obj.modo || '16 CH',
          cant: 0
        };
      }
      counts[name].cant++;

      const trussName = obj.truss?.nombre || 'Piso Escenario (Floor)';
      const type = obj.fixture?.tipo || 'Fixture';
      if (!trussSummary[trussName]) {
        trussSummary[trussName] = {};
      }
      if (!trussSummary[trussName][type]) {
        trussSummary[trussName][type] = 0;
      }
      trussSummary[trussName][type]++;
    });

    fixtureList = Object.values(counts).map(f => ({
      nombre: f.nombre,
      tipo: f.tipo,
      modelo: f.modelo,
      potencia: f.potencia,
      dmx: f.dmx,
      cant: f.cant.toString()
    }));

    trussList = Object.keys(trussSummary).map(trussName => {
      const types = trussSummary[trussName];
      const detail = Object.keys(types).map(t => `${types[t]} ${t}s`).join(' + ');
      const total = Object.values(types).reduce((a, b) => a + b, 0);
      return {
        truss: trussName,
        detail: detail,
        cant: total.toString()
      };
    });
  } else {
    fixtureList = [
      { nombre: 'Moving Head Beam 7R', tipo: 'Beam', modelo: 'Clay Paky / Sharpy', potencia: '230W', dmx: '16 CH', cant: '22' },
      { nombre: 'Moving Head Wash LED', tipo: 'Wash', modelo: 'Martin / Mac Aura', potencia: '300W', dmx: '15 CH', cant: '16' },
      { nombre: 'Paleta Led RGB', tipo: 'Led Bar', modelo: 'Chauvet / COLORband', potencia: '150W', dmx: '4 CH', cant: '12' },
      { nombre: 'COB LED 200W', tipo: 'Cob', modelo: 'Generic COB', potencia: '200W', dmx: '2 CH', cant: '8' },
      { nombre: 'Blinder 4 Canales', tipo: 'Blinder', modelo: 'Generic 4x100W', potencia: '400W', dmx: '4 CH', cant: '6' }
    ];
    trussList = [
      { truss: 'Puente Contra (Back Truss)', detail: '8 Beams (efectos aire) + 4 Barras LED (color base de fondo)', cant: '12' },
      { truss: 'Puente Cenital (Mid Truss)', detail: '8 Wash (baño de color escenario) + 4 Barras LED (contras cenitales)', cant: '12' },
      { truss: 'Puente Frontal (Front Truss)', detail: '6 Blinders (iluminación público) + 8 COB LEDs (iluminación base integrantes)', cant: '14' },
      { truss: 'Piso Escenario (Floor)', detail: '14 Beams (haces desde atrás y costados) + 8 Wash + 8 Paletas LED', cant: '30' }
    ];
  }

  let fxSummary = { Spark: 4, Smoke: 4, Hazer: 1 };
  if (dbEffects.length > 0) {
    const temp = {};
    dbEffects.forEach(fx => {
      if (!temp[fx.nombre]) temp[fx.nombre] = 0;
      temp[fx.nombre] += fx.cantidad;
    });
    Object.keys(temp).forEach(k => {
      fxSummary[k] = temp[k];
    });
  }

  // Resumen (Dos columnas a Y fijo = 125)
  const colY = 125;
  doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica-Bold').text('Resumen de Iluminación:', 40, colY);
  doc.font('Helvetica').fontSize(8.5).text(`Versión: ${layoutName}\nProtocolo: DMX-512 (Universo 1)\nTotal Focos Físicos: ${stageObjects.length || 64}`, 40, colY + 14, { lineGap: 2 });

  doc.font('Helvetica-Bold').text('Requerimientos Eléctricos:', 300, colY);
  doc.font('Helvetica').fontSize(8)
     .text('1. Alimentación trifásica de 380V con tierra dedicada exclusivamente a luces.\n2. Potencia mínima requerida de 30kW para el montaje completo.\n3. Splitters DMX activos para la distribución de señal a los trusses.', 300, colY + 14, { width: 250, lineGap: 2 });

  // 1. Tabla Fixtures (Y fijo = 190)
  let currentY = 190;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('1. EQUIPAMIENTO DETALLADO (FIXTURES):', 40, currentY);
  currentY += 15;

  const colWidthsL = [120, 60, 150, 60, 65, 60];
  const colTitlesL = ['Nombre Fixture', 'Tipo', 'Marca / Modelo', 'Potencia', 'Canales DMX', 'Cantidad'];

  doc.rect(40, currentY, 515, 18).fill(COLOR_PRIMARY);
  let currentXL = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  for (let i = 0; i < colTitlesL.length; i++) {
    doc.text(colTitlesL[i], currentXL + 6, currentY + 5, { width: colWidthsL[i] - 12 });
    currentXL += colWidthsL[i];
  }

  currentY += 18;
  doc.font('Helvetica').fontSize(7.5);

  fixtureList.forEach((f, idx) => {
    if (idx % 2 === 1) {
      doc.rect(40, currentY, 515, 18).fill(COLOR_LIGHT_BG);
    }
    doc.fillColor(COLOR_TEXT);

    let drawX = 40;
    doc.font('Helvetica-Bold').text(f.nombre, drawX + 6, currentY + 5, { width: colWidthsL[0] - 12 });
    drawX += colWidthsL[0];

    doc.font('Helvetica').text(f.tipo, drawX + 6, currentY + 5, { width: colWidthsL[1] - 12 });
    drawX += colWidthsL[1];

    doc.text(f.modelo, drawX + 6, currentY + 5, { width: colWidthsL[2] - 12 });
    drawX += colWidthsL[2];

    doc.text(f.potencia, drawX + 6, currentY + 5, { width: colWidthsL[3] - 12 });
    drawX += colWidthsL[3];

    doc.text(f.dmx, drawX + 6, currentY + 5, { width: colWidthsL[4] - 12 });
    drawX += colWidthsL[4];

    doc.font('Helvetica-Bold');
    doc.text(f.cant, drawX + 6, currentY + 5, { width: colWidthsL[5] - 12, align: 'center' });

    doc.rect(40, currentY + 18, 515, 0.5).fill(COLOR_BORDER);
    currentY += 18;
  });

  // 2. Tabla Estructuras
  currentY += 12;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('2. DISTRIBUCIÓN EN ESCENARIO:', 40, currentY);
  currentY += 15;

  const colWidthsTruss = [160, 290, 65];
  const colTitlesTruss = ['Estructura / Soporte', 'Detalle de Equipos Distribuidos', 'Total'];

  doc.rect(40, currentY, 515, 18).fill(COLOR_PRIMARY);
  let currentXT = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  for (let i = 0; i < colTitlesTruss.length; i++) {
    doc.text(colTitlesTruss[i], currentXT + 6, currentY + 5, { width: colWidthsTruss[i] - 12 });
    currentXT += colWidthsTruss[i];
  }

  currentY += 18;
  doc.font('Helvetica').fontSize(7.5);

  trussList.forEach((t, idx) => {
    if (idx % 2 === 1) {
      doc.rect(40, currentY, 515, 18).fill(COLOR_LIGHT_BG);
    }
    doc.fillColor(COLOR_TEXT);

    let drawX = 40;
    doc.font('Helvetica-Bold').text(t.truss, drawX + 6, currentY + 5, { width: colWidthsTruss[0] - 12 });
    drawX += colWidthsTruss[0];

    doc.font('Helvetica').text(t.detail, drawX + 6, currentY + 5, { width: colWidthsTruss[1] - 12 });
    drawX += colWidthsTruss[1];

    doc.font('Helvetica-Bold').text(t.cant, drawX + 6, currentY + 5, { width: colWidthsTruss[2] - 12, align: 'center' });

    doc.rect(40, currentY + 18, 515, 0.5).fill(COLOR_BORDER);
    currentY += 18;
  });

  // 3. Tabla FX Especiales
  currentY += 12;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('3. EFECTOS ESPECIALES (FX) REQUERIDOS:', 40, currentY);
  currentY += 15;

  doc.rect(40, currentY, 515, 45).fill(COLOR_GOLD_LIGHT);
  doc.rect(40, currentY, 515, 45).stroke(COLOR_GOLD);

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(8);
  doc.text('• MÁQUINAS DE CHISPA FRÍA (SPARKS):', 50, currentY + 8);
  doc.text('• MÁQUINAS DE HUMO VERTICAL (SMOKE):', 50, currentY + 20);
  doc.text('• MÁQUINA DE HUMO AMBIENTE (HAZER):', 50, currentY + 32);

  doc.fillColor(COLOR_TEXT).font('Helvetica');
  doc.text(`${fxSummary.Spark || 4} unidades en boca de escenario para momentos destacados del show.`, 245, currentY + 8);
  doc.text(`${fxSummary.Smoke || 4} unidades con iluminación LED, situadas detrás de las tarimas.`, 245, currentY + 20);
  doc.text(`${fxSummary.Hazer || 1} unidad de flujo continuo para destacar los haces de iluminación.`, 245, currentY + 32);

  drawFooter(doc, 1);
  doc.end();
}

// =====================================================================
// 3. GENERAR: STAGE PLOT PDF (OPCIÓN 1 & OPCIÓN 2 ILUSTRADAS)
// =====================================================================
function generateStagePlotPDF(stageObjects, members, layoutName, logoPath) {
  const pdfPath = path.join(downloadsDir, 'stageplot_banda_bruna.pdf');
  const pdfPathUnderscore = path.join(downloadsDir, 'stage_plot_banda_bruna.pdf');
  const stagePlot1Path = path.join(projectRoot, 'public', 'assets', 'images', 'rider', 'stage_plot_1.png');
  const stagePlot2Path = path.join(projectRoot, 'public', 'assets', 'images', 'rider', 'stage_plot_2.png');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // ----------------------------------------------------
  // PÁGINA 1: OPCIÓN 1 - DISTRIBUCIÓN ESTÁNDAR (FRONTAL)
  // ----------------------------------------------------
  drawHeader(doc, 'Plano de Escenario (Stage Plot)', 'Opción 1: Distribución Estándar (Frontal)', logoPath);

  // Metadatos y requerimientos físicos
  const colY = 114;
  doc.rect(40, colY, 515, 38).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).fontSize(8).font('Helvetica-Bold').text('ESPECIFICACIONES DE ESCENARIO:', 50, colY + 6);
  doc.font('Helvetica').fontSize(7).fillColor(COLOR_TEXT)
     .text('• Dimensión mínima: 10m Boca x 8m Fondo x 1.2m Altura\n• Tarimas: Batería 2x2m (H: 40cm) y Congas 2x2m (H: 40cm)', 50, colY + 17, { lineGap: 1.5 });

  doc.fillColor(COLOR_PRIMARY).fontSize(8).font('Helvetica-Bold').text('ENERGÍA & MONITOREO:', 305, colY + 6);
  doc.font('Helvetica').fontSize(7).fillColor(COLOR_TEXT)
     .text('• Corriente: 4 Puntos 220V estabilizada (Tarimas y Frontal)\n• Monitoreo: 5 IEMs Inalámbricos UHF + 2 Wedges de Piso Activos', 305, colY + 17, { lineGap: 1.5 });

  // Título de la Ilustración
  const imgY = 158;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(8.5).text('DIAGRAMA ILUSTRADO - OPCIÓN 1 (DISTRIBUCIÓN FRONTAL TÍPICA):', 40, imgY);

  // Ilustración 3D Opción 1
  if (fs.existsSync(stagePlot1Path)) {
    doc.image(stagePlot1Path, 40, imgY + 11, { width: 515, height: 289 });
    doc.rect(40, imgY + 11, 515, 289).stroke(COLOR_BORDER);
  }

  // Tabla Resumen de Músicos en Escenario
  let currentY1 = imgY + 306;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(8).text('ALINEACIÓN DE MÚSICOS & ASIGNACIÓN TÉCNICA (OPCIÓN 1):', 40, currentY1);
  currentY1 += 11;

  const colWidthsPlot1 = [65, 110, 110, 95, 135];
  const colTitlesPlot1 = ['Ubicación', 'Músico', 'Instrumento / Rol', 'Monitoreo', 'Conexión / Energía'];

  doc.rect(40, currentY1, 515, 15).fill(COLOR_PRIMARY);
  let currentXP1 = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  for (let i = 0; i < colTitlesPlot1.length; i++) {
    doc.text(colTitlesPlot1[i], currentXP1 + 5, currentY1 + 4, { width: colWidthsPlot1[i] - 10 });
    currentXP1 += colWidthsPlot1[i];
  }

  currentY1 += 15;
  doc.font('Helvetica').fontSize(6.8);

  const stageList = [
    { pos: 'Atrás Izq.', name: 'Jaime C. Sanhueza', inst: 'Congas & Bongós', aux: 'Aux 3 XLR', req: 'Tarima 2x2m c/alfombra' },
    { pos: 'Atrás Centro', name: 'Jaime C. Quilodrán', inst: 'Batería, Timbal & Octapad', aux: 'Aux 2 XLR + Aux 7 Wedge', req: 'Tarima 2x2m + 220V + Mixer' },
    { pos: 'Atrás Der.', name: 'Israel Lagos Rocha', inst: 'Pianos & Teclados', aux: 'Aux 1 XLR', req: '220V + 2 Cajas Directas (D.I.)' },
    { pos: 'Frente Izq.', name: 'Gerson Ulloa', inst: 'Bajo Eléctrico', aux: 'Aux 5 Bodypack + Aux 8 Wedge', req: '220V + Amplificador' },
    { pos: 'Frente C-Izq.', name: 'Fabián Garrido', inst: 'Güiro & Animación', aux: 'Aux 4 Bodypack', req: 'Inalámbrico (Mic & In-Ear)' },
    { pos: 'Frente Centro', name: 'César Bruna', inst: 'Voz Principal', aux: 'Aux 6 Bodypack', req: 'Inalámbrico (Beta 87A)' },
    { pos: 'Frente Der.', name: 'Vicente Núñez', inst: 'Guitarra Eléctrica & Dir.', aux: 'Aux 4 Bodypack', req: '220V + Amplificador + Pedales' }
  ];

  stageList.forEach((s, idx) => {
    const rh = 13.5;
    if (idx % 2 === 1) {
      doc.rect(40, currentY1, 515, rh).fill(COLOR_LIGHT_BG);
    }
    doc.fillColor(COLOR_TEXT);

    let drawX = 40;
    doc.font('Helvetica-Bold').text(s.pos, drawX + 5, currentY1 + 3, { width: colWidthsPlot1[0] - 10 });
    drawX += colWidthsPlot1[0];

    doc.font('Helvetica-Bold').text(s.name, drawX + 5, currentY1 + 3, { width: colWidthsPlot1[1] - 10 });
    drawX += colWidthsPlot1[1];

    doc.font('Helvetica').text(s.inst, drawX + 5, currentY1 + 3, { width: colWidthsPlot1[2] - 10 });
    drawX += colWidthsPlot1[2];

    doc.font('Helvetica-Bold').fillColor(s.aux.includes('Bodypack') ? '#7e22ce' : s.aux.includes('Wedge') ? '#1d4ed8' : '#b45309').text(s.aux, drawX + 5, currentY1 + 3, { width: colWidthsPlot1[3] - 10 });
    drawX += colWidthsPlot1[3];

    doc.fillColor(COLOR_MUTED).font('Helvetica').text(s.req, drawX + 5, currentY1 + 3, { width: colWidthsPlot1[4] - 10 });

    doc.rect(40, currentY1 + rh, 515, 0.5).fill(COLOR_BORDER);
    currentY1 += rh;
  });

  // Nota de aplicación al pie
  const noteBoxY = currentY1 + 7;
  doc.rect(40, noteBoxY, 515, 24).fill(COLOR_GOLD_LIGHT).stroke(COLOR_GOLD);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7).text('APLICACIÓN DE LA OPCIÓN 1:', 48, noteBoxY + 5);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(6.8).text('Configuración recomendada para la gran mayoría de festivales, teatros y eventos masivos al aire libre.', 48, noteBoxY + 13);

  drawFooter(doc, 1, 2);

  // ----------------------------------------------------
  // PÁGINA 2: OPCIÓN 2 - DISTRIBUCIÓN ALTERNATIVA
  // ----------------------------------------------------
  doc.addPage({ size: 'A4', margin: 40 });

  drawHeader(doc, 'Plano de Escenario (Stage Plot)', 'Opción 2: Distribución Alternativa (Teclados Lateral)', logoPath);

  // Explicación de la Opción 2
  const colY2 = 114;
  doc.rect(40, colY2, 515, 38).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).fontSize(8).font('Helvetica-Bold').text('CRITERIO DE MONTAJE OPCIÓN 2 (TECLADOS LATERAL):', 50, colY2 + 6);
  doc.font('Helvetica').fontSize(7).fillColor(COLOR_TEXT)
     .text('• Esta variante sitúa los teclados en ángulo lateral derecho mirando hacia el centro de la banda.\n• Especialmente indicada para escenarios con mayor fondo, festivales multi-banda o tarimas con acceso lateral.', 50, colY2 + 17, { lineGap: 1.5 });

  // Título de la Ilustración
  const imgY2 = 158;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(8.5).text('DIAGRAMA ILUSTRADO - OPCIÓN 2 (DISTRIBUCIÓN TECLADOS LATERAL):', 40, imgY2);

  // Ilustración 3D Opción 2
  if (fs.existsSync(stagePlot2Path)) {
    doc.image(stagePlot2Path, 40, imgY2 + 11, { width: 515, height: 289 });
    doc.rect(40, imgY2 + 11, 515, 289).stroke(COLOR_BORDER);
  }

  // Tabla Completa de Monitores de Retorno (8 Auxiliares)
  let currentY2 = imgY2 + 306;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(8).text('DISTRIBUCIÓN OFICIAL DE RETORNOS DE MONITOREO (8 AUXILIARES):', 40, currentY2);
  currentY2 += 11;

  const colWidthsMix2 = [50, 120, 140, 205];
  const colTitlesMix2 = ['Mezcla', 'Destino / Integrante', 'Tipo de Salida / Sistema', 'Especificación del Equipo'];

  doc.rect(40, currentY2, 515, 15).fill(COLOR_PRIMARY);
  let currentXS2 = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  for (let i = 0; i < colTitlesMix2.length; i++) {
    doc.text(colTitlesMix2[i], currentXS2 + 6, currentY2 + 4, { width: colWidthsMix2[i] - 12 });
    currentXS2 += colWidthsMix2[i];
  }

  currentY2 += 15;
  doc.font('Helvetica').fontSize(7);

  const mixes2 = [
    { mix: 'Aux 1', member: 'PIANO (Israel Lagos)', type: 'XLR (In-Ear Cableado)', spec: 'Retorno estéreo teclado, secuencias y click' },
    { mix: 'Aux 2', member: 'BATERIA (Jaime C. Q.)', type: 'XLR (In-Ear Cableado)', spec: 'Retorno batería, bajo, click y voces' },
    { mix: 'Aux 3', member: 'CONGA (Jaime C. S.)', type: 'XLR (In-Ear Cableado)', spec: 'Percusión latina, timbal, base y voces' },
    { mix: 'Aux 4', member: 'GUITAR - GÜIRA', type: 'BODYPACK (In-Ear UHF)', spec: 'Vicente N. & Fabián G.: guitarra y animación' },
    { mix: 'Aux 5', member: 'BASS (Gerson Ulloa)', type: 'BODYPACK (In-Ear UHF)', spec: 'Bajo al frente, bombo y armonía' },
    { mix: 'Aux 6', member: 'VOCAL (César Bruna)', type: 'BODYPACK (In-Ear UHF)', spec: 'Voz principal al frente y reverb' },
    { mix: 'Aux 7', member: 'PISO BATERIA', type: 'XLR (Monitor Wedge)', spec: '1 Monitor Activo 12" o 15" en tarima' },
    { mix: 'Aux 8', member: 'PISO BASS', type: 'XLR (Monitor Wedge)', spec: '1 Monitor Activo 12" o 15" en boca de escenario' }
  ];

  mixes2.forEach((m, idx) => {
    const rh = 13.5;
    if (idx % 2 === 1) {
      doc.rect(40, currentY2, 515, rh).fill(COLOR_LIGHT_BG);
    }
    doc.fillColor(COLOR_TEXT);

    let drawX = 40;
    doc.font('Helvetica-Bold').text(m.mix, drawX + 6, currentY2 + 3.5, { width: colWidthsMix2[0] - 12, align: 'center' });
    drawX += colWidthsMix2[0];

    doc.font('Helvetica-Bold').text(m.member, drawX + 6, currentY2 + 3.5, { width: colWidthsMix2[1] - 12 });
    drawX += colWidthsMix2[1];

    doc.font('Helvetica-Bold').fillColor(m.type.includes('BODYPACK') ? '#7e22ce' : m.type.includes('Wedge') ? '#1d4ed8' : '#b45309').text(m.type, drawX + 6, currentY2 + 3.5, { width: colWidthsMix2[2] - 12 });
    drawX += colWidthsMix2[2];

    doc.fillColor(COLOR_TEXT).font('Helvetica').text(m.spec, drawX + 6, currentY2 + 3.5, { width: colWidthsMix2[3] - 12 });

    doc.rect(40, currentY2 + rh, 515, 0.5).fill(COLOR_BORDER);
    currentY2 += rh;
  });

  // Tarjeta de contacto al pie
  const contactBoxY2 = currentY2 + 7;
  doc.rect(40, contactBoxY2, 515, 24).fill(COLOR_LIGHT_BG).stroke(COLOR_BORDER);
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(7).text('DIRECCIÓN TÉCNICA OFICIAL:', 48, contactBoxY2 + 5);
  doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(6.8).text('contacto@bandabruna.cl  •  +56 9 9002 1689 / +56 9 7614 9408  •  Temuco, Chile', 48, contactBoxY2 + 13);

  drawFooter(doc, 2, 2);
  doc.end();

  stream.on('finish', () => {
    try {
      fs.copyFileSync(pdfPath, pdfPathUnderscore);
      console.log('stageplot_banda_bruna.pdf y stage_plot_banda_bruna.pdf sincronizados.');
    } catch (err) {
      console.error('Error al sincronizar stage_plot_banda_bruna.pdf:', err.message);
    }
  });
}

// =====================================================================
// FLUJO PRINCIPAL
// =====================================================================
async function main() {
  let layoutId = '77777777-7777-7777-7777-777777777777'; 
  let layoutName = 'Show Oficial 2026';
  let supabase = null;
  let useFallback = true;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: layouts, error: layoutError } = await supabase
        .from('stage_layouts')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (!layoutError && layouts && layouts.length > 0) {
        layoutId = layouts[0].id;
        layoutName = layouts[0].nombre;
        useFallback = false;
        console.log(`Conectado a Supabase. Usando Layout: "${layoutName}" (${layoutId})`);
      }
    } catch (err) {
      console.warn('Fallo al conectar con Supabase. Usando datos locales:', err.message);
    }
  }

  // Cargar canales
  let canales = [];
  const defaultCanales = [
    { canal: 1, instrumento: 'KICK', conexion: 'SHURE BETA 91', categoria: 'Batería' },
    { canal: 2, instrumento: 'SNARE', conexion: 'SENNHEISER E609', categoria: 'Batería' },
    { canal: 3, instrumento: 'TIMBAL HI', conexion: 'SHURE SM57 - CLAMP CLAW LP', categoria: 'Batería' },
    { canal: 4, instrumento: 'TIMBAL LOW', conexion: 'SHURE SM57 - CLAMP CLAW LP', categoria: 'Batería' },
    { canal: 5, instrumento: 'OH ACCESORIOS', conexion: 'AKG C1000S - CLAMP CLAW LP', categoria: 'Batería' },
    { canal: 6, instrumento: 'OH HI-HAT', conexion: 'AKG C1000S', categoria: 'Batería' },
    { canal: 7, instrumento: 'BASS', conexion: 'XLR DIRECTO', categoria: 'Cuerdas / Armonía' },
    { canal: 8, instrumento: 'GUITAR', conexion: 'SHURE SM57', categoria: 'Cuerdas / Armonía' },
    { canal: 9, instrumento: 'TECLADO L', conexion: 'CAJA DIRECTA', categoria: 'Cuerdas / Armonía' },
    { canal: 10, instrumento: 'TECLADO R', conexion: 'CAJA DIRECTA', categoria: 'Cuerdas / Armonía' },
    { canal: 11, instrumento: 'CONGA HI', conexion: 'SENNHEISER E604 - CLAMP CLAW LP', categoria: 'Percusión' },
    { canal: 12, instrumento: 'CONGA LOW', conexion: 'SENNHEISER E604 - CLAMP CLAW LP', categoria: 'Percusión' },
    { canal: 13, instrumento: 'BONGO', conexion: 'SHURE SM57', categoria: 'Percusión' },
    { canal: 14, instrumento: 'CHIMES', conexion: 'AKG C1000S', categoria: 'Percusión' },
    { canal: 15, instrumento: 'VOZ DRUM', conexion: 'SHURE SM58', categoria: 'Voces' },
    { canal: 16, instrumento: 'VOZ GUITAR', conexion: 'SHURE SM58', categoria: 'Voces' },
    { canal: 17, instrumento: 'VOZ BASS', conexion: 'SHURE SM58', categoria: 'Voces' },
    { canal: 18, instrumento: 'VOZ CONGA', conexion: 'SHURE SM58', categoria: 'Voces' },
    { canal: 19, instrumento: 'VOZ PRINCIPAL', conexion: 'SHURE BETA 87A', categoria: 'Voces' },
    { canal: 20, instrumento: 'TALKBACK BATERIA - GUITAR', conexion: 'SHURE SM58', categoria: 'Voces' },
    { canal: 21, instrumento: 'OCTAPAD', conexion: 'DIRECT LINE RCA L', categoria: 'Batería' },
    { canal: 22, instrumento: 'GÜIRA', conexion: 'DIRECT LINE RCA R / SHURE BETA 98H/C', categoria: 'Percusión' },
    { canal: 23, instrumento: 'CLICK', conexion: 'USB', categoria: 'Secuencia / Otros' },
    { canal: 24, instrumento: 'GUIA', conexion: 'USB', categoria: 'Secuencia / Otros' },
    { canal: 25, instrumento: 'SECUENCIA L', conexion: 'USB', categoria: 'Secuencia / Otros' },
    { canal: 26, instrumento: 'SECUENCIA R', conexion: 'USB', categoria: 'Secuencia / Otros' }
  ];

  if (!useFallback && supabase) {
    const { data: dbCanales } = await supabase
      .from('rider_canales')
      .select('*')
      .or(`layout_id.eq.${layoutId},layout_id.is.null`)
      .order('canal', { ascending: true });

    if (dbCanales && dbCanales.length > 0) {
      canales = dbCanales.map(c => ({
        canal: c.canal,
        instrumento: c.instrumento,
        conexion: c.conexion,
        categoria: c.categoria === 'bateria' ? 'Batería' :
                   c.categoria === 'percusion' ? 'Percusión' :
                   c.categoria === 'cuerdas' ? 'Cuerdas / Armonía' :
                   c.categoria === 'voces' ? 'Voces' : c.categoria
      }));
    } else {
      canales = defaultCanales;
    }
  } else {
    canales = defaultCanales;
  }

  // Cargar focos y FX
  let stageObjects = [];
  let dbEffects = [];
  if (!useFallback && supabase) {
    const { data: dbObjects } = await supabase
      .from('layout_objects')
      .select('*, fixture:lighting_fixtures(*), truss:lighting_trusses(*)')
      .eq('layout_id', layoutId);

    const { data: fxData } = await supabase
      .from('lighting_effects')
      .select('*')
      .eq('layout_id', layoutId);

    if (dbObjects) stageObjects = dbObjects;
    if (fxData) dbEffects = fxData;
  }

  // Cargar integrantes para el Stage Plot en base a la distribución de Supabase (rider_stageplot)
  let members = [];
  const fallbackMembers = [
    { name: 'Cesar Bruna', role: 'Voz principal', x: 50, y: 20, tipo: 'vocal' },
    { name: 'Fabian Garrido', role: 'Guiro/Animación', x: 15, y: 20, tipo: 'guiro' },
    { name: 'Vicente Nuñez', role: 'Guitarra Electrica/Dirección/Coros', x: 32, y: 20, tipo: 'gtr' },
    { name: 'Gerson Ulloa', role: 'Bajos/Coros', x: 85, y: 20, tipo: 'bajo' },
    { name: 'Jaime Cardenas Quilodrán', role: 'Percusión/Timbal/Talkback/Voces', x: 25, y: 70, tipo: 'bateria' },
    { name: 'Jaime Cardenas Sanhueza', role: 'Congas/Bongos/Percusión/Coros', x: 75, y: 70, tipo: 'congas' },
    { name: 'Israel Lagos Rocha', role: 'Pianos/Teclados/Sintetizadores', x: 68, y: 20, tipo: 'teclado' }
  ];

  if (!useFallback && supabase) {
    try {
      const { data: dbStageData } = await supabase
        .from('rider_stageplot')
        .select('*');

      if (dbStageData && dbStageData.length > 0) {
        members = dbStageData.map(el => {
          let initials = '';
          let name = el.nombre;
          let role = '';
          let aux = el.retorno || '';
          let isWedge = false;
          let hasAC = false;
          let isMonitorOrPower = false;
          let iconEmoji = '';

          if (el.tipo === 'bateria') {
            initials = 'JQ';
            name = 'Jaime C. Quilodrán';
            role = 'Percusión/Timbal/Voces';
            aux = 'Aux 6 Wedge';
            isWedge = true;
            hasAC = true;
          } else if (el.tipo === 'congas') {
            initials = 'JS';
            name = 'Jaime C. Sanhueza';
            role = 'Congas/Bongós/Coros';
            aux = 'Aux 7 Wedge';
            isWedge = true;
            hasAC = true;
          } else if (el.tipo === 'teclado') {
            initials = 'IL';
            name = 'Israel Lagos Rocha';
            role = 'Pianos/Teclados/Sintetizadores';
            aux = 'Aux 5 IEM';
            hasAC = true;
          } else if (el.tipo === 'bajo') {
            initials = 'GU';
            name = 'Gerson Ulloa';
            role = 'Bajos/Coros';
            aux = 'Aux 4 IEM';
            hasAC = true;
          } else if (el.tipo === 'guiro') {
            initials = 'FG';
            name = 'Fabian Garrido';
            role = 'Guiro/Animación';
            aux = 'Aux 2 IEM';
          } else if (el.tipo === 'gtr') {
            initials = 'VN';
            name = 'Vicente Nuñez';
            role = 'Guitarra Electrica/Dir/Coros';
            aux = 'Aux 3 IEM';
            hasAC = true;
          } else if (el.tipo === 'vocal') {
            initials = 'CB';
            name = 'Cesar Bruna';
            role = 'Voz principal';
            aux = 'Aux 1 IEM';
          } else if (el.tipo === 'monitor') {
            initials = 'MON';
            name = el.nombre || 'Monitor';
            role = 'Retorno Escenario';
            aux = el.retorno || 'Wedge';
            isWedge = true;
            isMonitorOrPower = true;
            iconEmoji = 'M';
          } else if (el.tipo === 'power') {
            initials = '220V';
            name = el.nombre || 'Corriente';
            role = 'AC Power 220V';
            aux = 'Alimentación';
            isMonitorOrPower = true;
            iconEmoji = 'P';
            hasAC = true;
          } else {
            initials = el.nombre.substring(0, 2).toUpperCase();
            name = el.nombre;
            role = 'Elemento Stage';
            aux = el.retorno || '';
          }

          return {
            name,
            role,
            initials,
            aux,
            isWedge,
            hasAC,
            isMonitorOrPower,
            iconEmoji,
            x: el.pos_x != null ? parseFloat(el.pos_x) : 50,
            y: el.pos_y != null ? parseFloat(el.pos_y) : 50
          };
        });
      } else {
        // Mapear fallback
        members = fallbackMembers.map(m => ({
          name: m.name,
          role: m.role,
          initials: m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          aux: m.tipo === 'bateria' ? 'Aux 6 Wedge' : m.tipo === 'congas' ? 'Aux 7 Wedge' : m.tipo === 'teclado' ? 'Aux 5 IEM' : m.tipo === 'bajo' ? 'Aux 4 IEM' : m.tipo === 'guiro' ? 'Aux 2 IEM' : m.tipo === 'gtr' ? 'Aux 3 IEM' : 'Aux 1 IEM',
          isWedge: (m.tipo === 'bateria' || m.tipo === 'congas'),
          hasAC: (m.tipo === 'teclado' || m.tipo === 'bajo' || m.tipo === 'gtr' || m.tipo === 'bateria' || m.tipo === 'congas'),
          isMonitorOrPower: false,
          iconEmoji: '',
          x: m.x,
          y: m.y
        }));
      }
    } catch (err) {
      console.warn('Error al cargar integrantes de Supabase rider_stageplot:', err.message);
      // Mapear fallback en caso de error
      members = fallbackMembers.map(m => ({
        name: m.name,
        role: m.role,
        initials: m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        aux: m.tipo === 'bateria' ? 'Aux 6 Wedge' : m.tipo === 'congas' ? 'Aux 7 Wedge' : m.tipo === 'teclado' ? 'Aux 5 IEM' : m.tipo === 'bajo' ? 'Aux 4 IEM' : m.tipo === 'guiro' ? 'Aux 2 IEM' : m.tipo === 'gtr' ? 'Aux 3 IEM' : 'Aux 1 IEM',
        isWedge: (m.tipo === 'bateria' || m.tipo === 'congas'),
        hasAC: (m.tipo === 'teclado' || m.tipo === 'bajo' || m.tipo === 'gtr' || m.tipo === 'bateria' || m.tipo === 'congas'),
        isMonitorOrPower: false,
        iconEmoji: '',
        x: m.x,
        y: m.y
      }));
    }
  } else {
    // Mapear fallback
    members = fallbackMembers.map(m => ({
      name: m.name,
      role: m.role,
      initials: m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      aux: m.tipo === 'bateria' ? 'Aux 6 Wedge' : m.tipo === 'congas' ? 'Aux 7 Wedge' : m.tipo === 'teclado' ? 'Aux 5 IEM' : m.tipo === 'bajo' ? 'Aux 4 IEM' : m.tipo === 'guiro' ? 'Aux 2 IEM' : m.tipo === 'gtr' ? 'Aux 3 IEM' : 'Aux 1 IEM',
      isWedge: (m.tipo === 'bateria' || m.tipo === 'congas'),
      hasAC: (m.tipo === 'teclado' || m.tipo === 'bajo' || m.tipo === 'gtr' || m.tipo === 'bateria' || m.tipo === 'congas'),
      isMonitorOrPower: false,
      iconEmoji: '',
      x: m.x,
      y: m.y
    }));
  }

  // Descargar y procesar el logo oficial
  const logoPath = await getOfficialLogo();

  // Generar PDFs
  generateInputListPDF(canales, layoutName, logoPath);
  generateLightingPDF(stageObjects, dbEffects, layoutName, logoPath);
  generateStagePlotPDF(stageObjects, members, layoutName, logoPath);
}

main().catch(err => {
  console.error('Error catastrófico en el generador de PDFs:', err);
});
