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
function drawFooter(doc, pageNum) {
  doc.rect(40, 790, 515, 1).fill(COLOR_BORDER);
  doc.fillColor(COLOR_MUTED).fontSize(7).font('Helvetica').text('Portal de Producción Técnica v2.0 - Banda Bruna • contacto@bandabruna.cl • Temuco, Chile', 40, 798, { width: 400 });
  doc.text(`Página ${pageNum}`, 440, 798, { width: 115, align: 'right' });
}

// =====================================================================
// 1. GENERAR: INPUT LIST PDF
// =====================================================================
function generateInputListPDF(canales, layoutName, logoPath) {
  const pdfPath = path.join(downloadsDir, 'input_list_banda_bruna.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(pdfPath));

  drawHeader(doc, 'Input List & Audio Patch', `Ficha Oficial: ${layoutName}`, logoPath);

  // Metadatos de la ficha (Dos columnas estables, sin usar doc.y dinámico relativo para evitar encimamientos)
  const colY = 125;
  doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica-Bold').text('Detalles del Montaje:', 40, colY);
  doc.font('Helvetica').fontSize(8.5).text(`Versión: ${layoutName}\nCanales en uso: ${canales.length}\nÚltima actualización: Julio 2026`, 40, colY + 14, { lineGap: 2 });

  doc.font('Helvetica-Bold').text('Notas de Consola:', 300, colY);
  doc.font('Helvetica').fontSize(8)
     .text('1. Consola digital (Midas M32, Behringer X32 o superior) requerida.\n2. EQ paramétrica de 4 bandas, gate y compressor activos por canal.\n3. Monitoreo inalámbrico in-ear y mezcla independiente por integrante.', 300, colY + 14, { width: 250, lineGap: 2 });

  // Tabla Canales (Comienza a Y fijo = 190 para evitar colisión con las notas)
  let currentY = 190;
  const colWidths = [30, 130, 240, 115];
  const colTitles = ['Ch', 'Instrumento / Fuente', 'Micrófono / Conexión sugerida', 'Categoría'];

  // Cabecera de la Tabla
  doc.rect(40, currentY, 515, 20).fill(COLOR_PRIMARY);
  let currentX = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  for (let i = 0; i < colTitles.length; i++) {
    doc.text(colTitles[i], currentX + 6, currentY + 6, { width: colWidths[i] - 12 });
    currentX += colWidths[i];
  }

  currentY += 20;
  doc.font('Helvetica').fontSize(8);

  canales.forEach((c, idx) => {
    // Zebra striping
    if (idx % 2 === 1) {
      doc.rect(40, currentY, 515, 18).fill(COLOR_LIGHT_BG);
    }
    
    doc.fillColor(COLOR_TEXT);
    let drawX = 40;
    
    doc.text(c.canal.toString(), drawX + 6, currentY + 5, { width: colWidths[0] - 12, align: 'center' });
    drawX += colWidths[0];
    
    doc.font('Helvetica-Bold');
    doc.text(c.instrumento, drawX + 6, currentY + 5, { width: colWidths[1] - 12 });
    drawX += colWidths[1];
    
    doc.font('Helvetica');
    doc.text(c.conexion, drawX + 6, currentY + 5, { width: colWidths[2] - 12 });
    drawX += colWidths[2];
    
    doc.fillColor(COLOR_MUTED);
    doc.text(c.categoria, drawX + 6, currentY + 5, { width: colWidths[3] - 12 });
    
    doc.rect(40, currentY + 18, 515, 0.5).fill(COLOR_BORDER);
    currentY += 18;
  });

  // Requerimientos Generales adicionales
  doc.y = currentY + 15;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('SISTEMA DE MONITOREO (RETORNOS):', 40);
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8).text(
    '• Aux 1 (IEM): César Bruna (Voz Principal) • Aux 2 (IEM): Fabián Garrido (Güiro/Animación)\n' +
    '• Aux 3 (IEM): Vicente Núñez (Gtr/Dir/Coros) • Aux 4 (IEM): Gerson Ulloa (Bajo/Coros)\n' +
    '• Aux 5 (IEM): Israel Lagos Rocha (Teclados) • Aux 6 (Wedge): Jaime C. Quilodrán (Timbal)\n' +
    '• Aux 7 (Wedge): Jaime C. Sanhueza (Congas)', 40, doc.y + 4, { lineGap: 2 }
  );

  drawFooter(doc, 1);
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
// 3. GENERAR: STAGE PLOT PDF
// =====================================================================
function generateStagePlotPDF(stageObjects, members, layoutName, logoPath) {
  const pdfPath = path.join(downloadsDir, 'stageplot_banda_bruna.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(pdfPath));

  drawHeader(doc, 'Plano de Distribución de Escenario (Stage Plot)', `Ficha Oficial: ${layoutName}`, logoPath);

  // Metadatos de la ficha (Dos columnas estables, Y fijo = 125)
  const colY = 125;
  doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica-Bold').text('Detalles del Escenario:', 40, colY);
  doc.font('Helvetica').fontSize(8.5).text(`Dimensión mínima: 10m Ancho x 8m Fondo\nTarimas: Batería y Percusión (2x2m, H: 40cm)\n[AC] Alimentación eléctrica 220V disponible`, 40, colY + 14, { lineGap: 2 });

  doc.font('Helvetica-Bold').text('Distribución IEMs / Retornos:', 300, colY);
  doc.font('Helvetica').fontSize(8)
       .text('• Aux 1: César Bruna (IEM Voz) • Aux 2: Fabián G. (IEM Gtr)\n• Aux 3: Vicente N. (IEM Bajo) • Aux 4: Gerson U. (IEM Teclado)\n• Aux 5: Baterista (IEM) • Aux 6: Percusión (1 Wedge de piso)', 300, colY + 14, { width: 250, lineGap: 2 });

  // Diagrama del Escenario (Comienza en Y fijo = 190)
  const stageY = 205;
  const stageX = 60;
  const stageW = 475;
  const stageH = 220;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('DIAGRAMA DE DISTRIBUCIÓN EN ESCENARIO:', 40, 190);

  // Escenario base
  doc.rect(stageX, stageY, stageW, stageH).fill(COLOR_PRIMARY);

  // Grid suave de fondo
  doc.strokeColor('rgba(255,255,255,0.05)').lineWidth(0.5);
  for (let x = stageX + 40; x < stageX + stageW; x += 40) {
    doc.moveTo(x, stageY).lineTo(x, stageY + stageH).stroke();
  }
  for (let y = stageY + 40; y < stageY + stageH; y += 40) {
    doc.moveTo(stageX, y).lineTo(stageX + stageW, y).stroke();
  }

  // Tarimas de Referencia en el escenario (Fondo)
  doc.rect(stageX + 50, stageY + 110, 110, 80).fill('#111827').strokeColor('rgba(212,175,55,0.25)').lineWidth(1).stroke();
  doc.fillColor('rgba(255,255,255,0.15)').fontSize(7).font('Helvetica-Bold').text('TARIMA TIMBAL', stageX + 55, stageY + 115, { width: 100, align: 'center' });
  
  doc.rect(stageX + stageW - 160, stageY + 110, 110, 80).fill('#111827').strokeColor('rgba(212,175,55,0.25)').lineWidth(1).stroke();
  doc.fillColor('rgba(255,255,255,0.15)').fontSize(7).font('Helvetica-Bold').text('TARIMA CONGAS', stageX + stageW - 155, stageY + 115, { width: 100, align: 'center' });

  // Integrantes dinámicos dibujados en base a sus coordenadas X e Y (0-100)
  members.forEach(m => {
    const px = stageX + (m.x / 100) * stageW;
    const py = stageY + (m.y / 100) * stageH;

    const borderColor = m.isWedge ? '#3b82f6' : m.role.includes('AC Power') ? '#10b981' : COLOR_GOLD;
    const circleColor = '#1e293b';

    // Dibujar círculo
    doc.circle(px, py, 16).fill(circleColor).strokeColor(borderColor).lineWidth(1.5).stroke();
    
    if (m.isMonitorOrPower) {
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(m.iconEmoji, px - 15, py - 4, { width: 30, align: 'center' });
    } else {
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold').text(m.initials, px - 15, py - 3, { width: 30, align: 'center' });
    }

    // Etiqueta de nombre y rol (colocada debajo o arriba dependiendo del borde)
    let labelY = py + 18;
    if (m.y > 85) {
      labelY = py - 32;
    }

    doc.fillColor('#ffffff').fontSize(6.5).font('Helvetica-Bold').text(m.name.split(' ')[0] + ' ' + (m.name.split(' ')[1] || ''), px - 35, labelY, { width: 70, align: 'center' });
    doc.fillColor(m.isWedge ? '#60a5fa' : COLOR_GOLD).fontSize(6).font('Helvetica').text(m.role.split('/')[0], px - 35, labelY + 7, { width: 70, align: 'center' });
    if (!m.isMonitorOrPower) {
      doc.fillColor('#94a3b8').fontSize(5.5).text(m.aux, px - 35, labelY + 13, { width: 70, align: 'center' });
    }
  });

  // Graficar focos DMX dinámicamente
  if (stageObjects.length > 0) {
    stageObjects.forEach(obj => {
      const px = stageX + (obj.posicion_x / 100) * stageW;
      const py = stageY + (1 - obj.posicion_y / 100) * stageH;
      
      let color = '#ef4444'; // Beam = rojo
      if (obj.fixture?.tipo === 'Wash') color = '#3b82f6';
      else if (obj.fixture?.tipo === 'Led Bar') color = '#10b981';
      else if (obj.fixture?.tipo === 'Cob') color = '#eab308';
      else if (obj.fixture?.tipo === 'Blinder') color = '#f97316';

      doc.circle(px, py, 3.5).fill(color);
    });

    // Leyenda de mini-plot
    doc.rect(stageX + 5, stageY + 5, 110, 22).fill('rgba(15,23,42,0.85)');
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('Focos: •Beam •Wash •Led •COB •Blinder', stageX + 10, stageY + 9);
  }

  doc.rect(stageX, stageY + stageH - 12, stageW, 12).fill('#0f172a');
  doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica-Bold').text('BOCA DE ESCENARIO (PÚBLICO)', stageX, stageY + stageH - 9, { width: stageW, align: 'center' });

  // Tabla Retornos (Comienza a Y fijo = 445, con anchos de columna optimizados contra encimamientos)
  let currentYS = 460;
  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('DISTRIBUCIÓN DE MONITORES DE RETORNO:', 40, 445);

  const colWidthsMix = [50, 110, 150, 205];
  const colTitlesMix = ['Mezcla', 'Integrante', 'Tipo de Monitoreo', 'Especificación del Equipo'];

  doc.rect(40, currentYS, 515, 18).fill(COLOR_PRIMARY);
  let currentXS = 40;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  for (let i = 0; i < colTitlesMix.length; i++) {
    doc.text(colTitlesMix[i], currentXS + 6, currentYS + 5, { width: colWidthsMix[i] - 12 });
    currentXS += colWidthsMix[i];
  }

  const mixes = [
    { mix: 'Aux 1', member: 'Cesar Bruna', type: 'IEM Inalámbrico (Mono/Estéreo)', spec: 'Transmisor UHF / Shure PSM300' },
    { mix: 'Aux 2', member: 'Fabian Garrido', type: 'IEM Inalámbrico (Mono)', spec: 'Transmisor UHF / Shure PSM300' },
    { mix: 'Aux 3', member: 'Vicente Nuñez', type: 'IEM Inalámbrico (Mono)', spec: 'Transmisor UHF / Shure PSM300' },
    { mix: 'Aux 4', member: 'Gerson Ulloa', type: 'IEM Inalámbrico (Mono)', spec: 'Transmisor UHF / Shure PSM300' },
    { mix: 'Aux 5', member: 'Israel Lagos Rocha', type: 'IEM Inalámbrico (Mono)', spec: 'Transmisor UHF / Shure PSM300' },
    { mix: 'Aux 6', member: 'Jaime Cardenas Quilodrán', type: 'Monitor de Piso Wedge', spec: '1 Monitor Activo de 12" o 15"' },
    { mix: 'Aux 7', member: 'Jaime Cardenas Sanhueza', type: 'Monitor de Piso Wedge', spec: '1 Monitor Activo de 12" o 15"' }
  ];

  currentYS += 18;
  doc.font('Helvetica').fontSize(7.5);

  mixes.forEach((m, idx) => {
    if (idx % 2 === 1) {
      doc.rect(40, currentYS, 515, 18).fill(COLOR_LIGHT_BG);
    }
    doc.fillColor(COLOR_TEXT);

    let drawX = 40;
    doc.font('Helvetica-Bold').text(m.mix, drawX + 6, currentYS + 5, { width: colWidthsMix[0] - 12, align: 'center' });
    drawX += colWidthsMix[0];

    doc.font('Helvetica-Bold').text(m.member, drawX + 6, currentYS + 5, { width: colWidthsMix[1] - 12 });
    drawX += colWidthsMix[1];

    doc.font('Helvetica').text(m.type, drawX + 6, currentYS + 5, { width: colWidthsMix[2] - 12 });
    drawX += colWidthsMix[2];

    doc.text(m.spec, drawX + 6, currentYS + 5, { width: colWidthsMix[3] - 12 });

    doc.rect(40, currentYS + 18, 515, 0.5).fill(COLOR_BORDER);
    currentYS += 18;
  });

  drawFooter(doc, 1);
  doc.end();
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
    { canal: 1, instrumento: 'KICK', conexion: 'SHURE PGA52', categoria: 'Batería' },
    { canal: 2, instrumento: 'SNARE', conexion: 'SHURE PGA57', categoria: 'Batería' },
    { canal: 3, instrumento: 'TIMBAL HIGH', conexion: 'SHURE PGA56', categoria: 'Batería' },
    { canal: 4, instrumento: 'TIMBAL LOW', conexion: 'SHURE PGA56', categoria: 'Batería' },
    { canal: 5, instrumento: 'OCTAPAD', conexion: 'CAJA DIRECTA (DI)', categoria: 'Batería' },
    { canal: 6, instrumento: 'OH L', conexion: 'SHURE PGA81', categoria: 'Batería' },
    { canal: 7, instrumento: 'OH R', conexion: 'SHURE PGA81', categoria: 'Batería' },
    { canal: 8, instrumento: 'CONGA HIGH', conexion: 'SHURE PGA56', categoria: 'Percusión' },
    { canal: 9, instrumento: 'CONGA LOW', conexion: 'SHURE PGA56', categoria: 'Percusión' },
    { canal: 10, instrumento: 'BONGOS', conexion: 'SHURE SM57', categoria: 'Percusión' },
    { canal: 11, instrumento: 'CHIMES', conexion: 'SHURE SM57', categoria: 'Percusión' },
    { canal: 12, instrumento: 'BASS (DI)', conexion: 'CAJA DIRECTA ACTIVA', categoria: 'Cuerdas / Armonía' },
    { canal: 13, instrumento: 'GTR ACUSTICA', conexion: 'CAJA DIRECTA', categoria: 'Cuerdas / Armonía' },
    { canal: 14, instrumento: 'GTR ELECTRICA', conexion: 'MIC (SM57 / PGA57)', categoria: 'Cuerdas / Armonía' },
    { canal: 15, instrumento: 'TECLADO L', conexion: 'CAJA DIRECTA L', categoria: 'Cuerdas / Armonía' },
    { canal: 16, instrumento: 'TECLADO R', conexion: 'CAJA DIRECTA R', categoria: 'Cuerdas / Armonía' },
    { canal: 17, instrumento: 'VOZ MAIN (CÉSAR BRUNA)', conexion: 'SHURE BETA 58 WIRELESS', categoria: 'Voces' },
    { canal: 18, instrumento: 'VOZ CORO (VICENTE NUÑEZ)', conexion: 'SHURE SM58', categoria: 'Voces' },
    { canal: 19, instrumento: 'VOZ CORO (GERSON ULLOA)', conexion: 'SHURE SM58', categoria: 'Voces' }
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
