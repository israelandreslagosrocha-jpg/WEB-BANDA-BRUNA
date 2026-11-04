import { generateRiderDocuments } from './rider_documents.js';
import { backlineInstruments } from '../src/data/productionRequirements.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

// Snapshot reproducible para builds sin acceso a la base de datos.
const snapshotPath = path.join(__dirname, 'data', 'production_snapshot.json');
async function main() {
  let snapshot = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) : {
    layoutName: 'Festival / Planta Oficial 2026', stageObjects: [], dbEffects: [], backline: backlineInstruments
  };
  if (!process.argv.includes('--offline') && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: (url, options = {}) => fetch(url, {...options, signal: AbortSignal.timeout(15000)}) }
    });
    const {data: layouts, error} = await supabase.from('stage_layouts').select('*').eq('activo', true).order('nombre');
    if (!error && layouts?.length) {
      const layout = layouts[0];
      const [objects, effects, requirements] = await Promise.all([
        supabase.from('layout_objects').select('*, fixture:lighting_fixtures(*), truss:lighting_trusses(*)').eq('layout_id', layout.id),
        supabase.from('lighting_effects').select('*').eq('layout_id', layout.id),
        supabase.from('rider_requerimientos').select('*')
      ]);
      if (objects.error || effects.error || requirements.error) {
        throw new Error('No fue posible obtener los requerimientos completos de producción.');
      }
      const backline = backlineInstruments.map(inst => {
        const req = requirements.data?.find(r => r.categoria === `backline_${inst.id}`);
        return {...inst, defaultItems: req?.items?.length ? req.items : inst.defaultItems};
      });
      snapshot = {layoutName: layout.nombre, stageObjects: objects.data || [], dbEffects: effects.data || [], backline};
      fs.mkdirSync(path.dirname(snapshotPath), {recursive: true});
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
      console.log(`Requerimientos actuales: ${snapshot.stageObjects.length} luminarias; layout ${layout.nombre}.`);
    } else if (!fs.existsSync(snapshotPath)) {
      throw new Error('Sin datos de producción ni snapshot. Conectar antes de generar la ficha completa.');
    } else {
      console.warn('Base de datos no disponible; usando snapshot de producción guardado.');
    }
  }
  const logoPath = await getOfficialLogo();
  await generateRiderDocuments({projectRoot, downloadsDir, logoPath, ...snapshot});
}
main().catch(err => { console.error('Error al generar ficha técnica:', err.message); process.exitCode = 1; });
