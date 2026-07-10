import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del archivo .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan credenciales de Supabase en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function detectProvider(url, codec) {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('streamtheworld')) {
    return 3; // StreamTheWorld
  }
  if (lowercaseUrl.includes('status-json.xsl')) {
    return 1; // Icecast
  }
  if (lowercaseUrl.includes('/stats') || lowercaseUrl.includes('/7.html') || lowercaseUrl.includes(':8000') || lowercaseUrl.includes(':8002')) {
    return 2; // Shoutcast
  }
  return 5; // Otro
}

async function main() {
  console.log("Descargando catálogo nacional desde la API de Radio Browser...");
  const apiUrl = 'https://de1.api.radio-browser.info/json/stations/bycountry/chile';
  
  let stations = [];
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    stations = await res.json();
    console.log(`Descargadas ${stations.length} radios de Chile.`);
  } catch (err) {
    console.error("Error al descargar desde Radio Browser:", err.message);
    process.exit(1);
  }

  // 1. Obtener los proveedores de Supabase para confirmar mapeos
  const { data: providers, error: providersError } = await supabase
    .from('radio_providers')
    .select('id, nombre');

  if (providersError) {
    console.error('Error al obtener proveedores de radio:', providersError);
    process.exit(1);
  }
  console.log(`Proveedores cargados desde Supabase:`, providers);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  console.log("Iniciando procesamiento e inserción en Supabase...");

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    
    // Limpiar el nombre de la radio
    let nombre = station.name
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!nombre || nombre.length < 2) {
      skippedCount++;
      continue;
    }

    const streamUrl = station.url_resolved || station.url;
    if (!streamUrl || !streamUrl.startsWith('http')) {
      skippedCount++;
      continue;
    }

    // Generar slug único limpio incorporando la UUID corta de la estación para evitar duplicados en BD
    const stationUuidShort = station.stationuuid ? station.stationuuid.split('-')[0] : i.toString();
    const rawSlug = `${nombre}-${stationUuidShort}`;
    const slug = slugify(rawSlug);

    // Mapear región y ciudad
    let region = station.state ? station.state.trim() : 'Chile';
    let ciudad = station.state ? station.state.trim() : 'Nacional';

    // Normalizar regiones conocidas
    const lowerRegion = region.toLowerCase();
    if (lowerRegion.includes('metrop') || lowerRegion.includes('santiago')) {
      region = 'Metropolitana';
      ciudad = 'Santiago';
    } else if (lowerRegion.includes('araucania') || lowerRegion.includes('temuco')) {
      region = 'La Araucanía';
    } else if (lowerRegion.includes('bio') || lowerRegion.includes('concep')) {
      region = 'Biobío';
    } else if (lowerRegion.includes('valpa') || lowerRegion.includes('vina')) {
      region = 'Valparaíso';
    }

    // Mapear proveedor de forma automática
    const providerId = detectProvider(streamUrl, station.codec);

    // Formatear objeto final para Supabase
    const radioData = {
      nombre: nombre.slice(0, 100),
      slug: slug.slice(0, 150),
      region: region.slice(0, 100),
      ciudad: ciudad.slice(0, 100),
      logo_url: station.favicon ? station.favicon.slice(0, 500) : '/assets/logo-bruna-gold-glow.png',
      sitio_web: station.homepage ? station.homepage.slice(0, 255) : '',
      stream_url: streamUrl.slice(0, 500),
      metadata_url: null,
      bitrate: station.bitrate ? parseInt(station.bitrate) : 128,
      formato: station.codec ? station.codec.toLowerCase().slice(0, 10) : 'mp3',
      activo: true,
      provider_id: providerId
    };

    // Consultamos si ya existe por slug o stream_url
    const { data: existing, error: queryError } = await supabase
      .from('radios')
      .select('id')
      .or(`slug.eq.${slug},stream_url.eq.${streamUrl}`)
      .maybeSingle();

    if (queryError) {
      console.error(`Error al consultar "${nombre}":`, queryError.message);
      skippedCount++;
      continue;
    }

    if (existing) {
      // Actualizar datos
      const { error: updateError } = await supabase
        .from('radios')
        .update(radioData)
        .eq('id', existing.id);

      if (updateError) {
        console.error(`Error al actualizar "${nombre}":`, updateError.message);
      } else {
        updatedCount++;
      }
    } else {
      // Insertar nuevo registro
      const { error: insertError } = await supabase
        .from('radios')
        .insert(radioData);

      if (insertError) {
        console.error(`Error al insertar "${nombre}":`, insertError.message);
      } else {
        insertedCount++;
      }
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Procesadas ${i + 1}/${stations.length} radios...`);
    }
  }

  console.log(`\n=== Proceso de Importación Finalizado ===`);
  console.log(`Nuevas radios añadidas: ${insertedCount}`);
  console.log(`Radios existentes actualizadas: ${updatedCount}`);
  console.log(`Radios saltadas/inválidas: ${skippedCount}`);
}

main().catch(err => {
  console.error("Error crítico durante la importación masiva:", err);
});
