import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statsFilePath = path.join(__dirname, '..', 'src', 'data', 'socialStats.json');

// 1. Valores por defecto / existentes
let stats = {
  musiciansTrajectory: 15,
  stageYears: 10,
  instagramFollowers: 3190,
  facebookFriends: 4900,
  youtubeSubscribers: 577,
  tiktokFollowers: 1095,
  regions: 5,
  lastUpdated: new Date().toISOString()
};

// Cargar estadísticas actuales como base
if (fs.existsSync(statsFilePath)) {
  try {
    const rawData = fs.readFileSync(statsFilePath, 'utf8');
    stats = { ...stats, ...JSON.parse(rawData) };
    console.log('Estadísticas locales cargadas:', stats);
  } catch (err) {
    console.warn('No se pudo leer el archivo local de estadísticas, usando valores por defecto:', err.message);
  }
}

// 2. URL del JSON público de Google Sheets
const sheetId = '1im9i2l0LuXuUdIGFpQq3u7Gxw5Rh_nnPDC0uB7x8QdY';
const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

async function fetchStatsFromGoogleSheets() {
  try {
    console.log('Consultando estadísticas desde Google Sheets...');
    const res = await fetch(gvizUrl);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const text = await res.text();
    
    // Extraer JSON del wrapper google.visualization.Query.setResponse(...)
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match) {
      throw new Error('Formato de respuesta de Google Sheets no reconocido.');
    }
    
    const json = JSON.parse(match[1]);
    const rows = json.table?.rows || [];
    
    if (rows.length === 0) {
      console.log('La hoja de Google Sheets está vacía. Se conservan las estadísticas actuales.');
      return;
    }
    
    let updatedCount = 0;
    
    rows.forEach(row => {
      // row.c representa las celdas [A, B, C, D]
      if (row.c && row.c[0] && row.c[1]) {
        const platform = String(row.c[0].v).toLowerCase().trim();
        const value = parseInt(row.c[1].v, 10);
        
        if (!isNaN(value) && value > 0) {
          if (platform === 'youtube') {
            stats.youtubeSubscribers = value;
            updatedCount++;
          } else if (platform === 'instagram') {
            stats.instagramFollowers = value;
            updatedCount++;
          } else if (platform === 'tiktok') {
            stats.tiktokFollowers = value;
            updatedCount++;
          } else if (platform === 'facebook') {
            stats.facebookFriends = value;
            updatedCount++;
          }
        }
      }
    });
    
    console.log(`Se actualizaron ${updatedCount} estadísticas desde Google Sheets.`);
  } catch (err) {
    console.error('Error al obtener datos de Google Sheets (se mantendrán las estadísticas anteriores):', err.message);
  }
}

async function run() {
  await fetchStatsFromGoogleSheets();
  
  // Guardar fecha de actualización
  stats.lastUpdated = new Date().toISOString();
  
  // Escribir archivo socialStats.json
  try {
    const dir = path.dirname(statsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf8');
    console.log('Archivo de estadísticas guardado:', stats);
  } catch (err) {
    console.error('Error al guardar el archivo de estadísticas:', err.message);
  }
}

run();
