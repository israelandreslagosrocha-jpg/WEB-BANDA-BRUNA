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

async function main() {
  const catalogPath = path.join(__dirname, 'radios_catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error("Error: No se encuentra el archivo scripts/radios_catalog.json");
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Cargadas ${catalog.length} radios desde el catálogo JSON.`);

  // 1. Obtener los proveedores existentes para mapear sus IDs
  const { data: providers, error: providersError } = await supabase
    .from('radio_providers')
    .select('*');

  if (providersError) {
    console.error('Error al obtener proveedores de radio:', providersError);
    process.exit(1);
  }

  const providerMap = new Map(providers.map(p => [p.nombre, p.id]));
  console.log(`Proveedores mapeados en Supabase: ${providers.length}`);

  let inserted = 0;
  let updated = 0;

  for (const radio of catalog) {
    const providerId = providerMap.get(radio.provider_name);
    if (!providerId) {
      console.warn(`Advertencia: Proveedor "${radio.provider_name}" no encontrado para la radio "${radio.nombre}". Saltando...`);
      continue;
    }

    const { provider_name, ...radioData } = radio;
    const finalRadio = {
      ...radioData,
      provider_id: providerId
    };

    // Consultamos si ya existe por slug
    const { data: existing, error: queryError } = await supabase
      .from('radios')
      .select('id')
      .eq('slug', radio.slug)
      .maybeSingle();

    if (queryError) {
      console.error(`Error al consultar radio "${radio.nombre}":`, queryError.message);
      continue;
    }

    if (existing) {
      // Actualizar
      const { error: updateError } = await supabase
        .from('radios')
        .update(finalRadio)
        .eq('id', existing.id);

      if (updateError) {
        console.error(`Error al actualizar radio "${radio.nombre}":`, updateError.message);
      } else {
        updated++;
      }
    } else {
      // Insertar
      const { error: insertError } = await supabase
        .from('radios')
        .insert(finalRadio);

      if (insertError) {
        console.error(`Error al insertar radio "${radio.nombre}":`, insertError.message);
      } else {
        inserted++;
      }
    }
  }

  console.log(`Carga finalizada con éxito.`);
  console.log(`Nuevas radios registradas: ${inserted}`);
  console.log(`Radios existentes actualizadas: ${updated}`);
}

main().catch(err => {
  console.error("Error crítico durante la importación:", err);
});
