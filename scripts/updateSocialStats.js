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
  instagramFollowers: 3359,
  facebookFriends: 5000,
  youtubeSubscribers: 911,
  tiktokFollowers: 1136,
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
            stats.youtubeSubscribers = Math.max(value, 911);
            updatedCount++;
          } else if (platform === 'instagram') {
            stats.instagramFollowers = Math.max(value, 3359);
            updatedCount++;
          } else if (platform === 'tiktok') {
            stats.tiktokFollowers = Math.max(value, 1136);
            updatedCount++;
          } else if (platform === 'facebook') {
            stats.facebookFriends = Math.max(value, 5000);
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

// 3. Obtener estadísticas del videoclip oficial "Ahogado en un Bar"
async function fetchYouTubeVideoStats() {
  const launchStatsFilePath = path.join(__dirname, '..', 'src', 'data', 'launchStats.json');
  let currentLaunchStats = {
    slug: 'ahogado-en-un-bar',
    youtube_id: 'mZhYl60ENAs',
    youtube_views: 26249,
    youtube_likes: 239,
    lastUpdated: new Date().toISOString()
  };

  if (fs.existsSync(launchStatsFilePath)) {
    try {
      currentLaunchStats = { ...currentLaunchStats, ...JSON.parse(fs.readFileSync(launchStatsFilePath, 'utf8')) };
    } catch {}
  }

  try {
    console.log('Consultando estadísticas de YouTube para "Ahogado en un Bar"...');
    const res = await fetch('https://www.youtube.com/watch?v=mZhYl60ENAs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const viewMatch = html.match(/"viewCount":"(\d+)"/);
      const likeMatch = html.match(/"likeCount":"(\d+)"/);

      if (viewMatch && parseInt(viewMatch[1], 10) > 0) {
        currentLaunchStats.youtube_views = parseInt(viewMatch[1], 10);
      }
      if (likeMatch && parseInt(likeMatch[1], 10) > 0) {
        currentLaunchStats.youtube_likes = parseInt(likeMatch[1], 10);
      }
      currentLaunchStats.lastUpdated = new Date().toISOString();
      console.log('Estadísticas de YouTube actualizadas:', currentLaunchStats);
    }
  } catch (err) {
    console.warn('No se pudo obtener datos en vivo de YouTube, manteniendo estadísticas previas:', err.message);
  }

  try {
    const dir = path.dirname(launchStatsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(launchStatsFilePath, JSON.stringify(currentLaunchStats, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar launchStats.json:', err.message);
  }
}

async function run() {
  await fetchStatsFromGoogleSheets();
  await fetchYouTubeVideoStats();
  
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
