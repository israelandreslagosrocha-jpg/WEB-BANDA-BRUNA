import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan credenciales de Supabase en el archivo .env (PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Catálogo Inicial de Semilla con las principales radios chilenas verificadas
const INITIAL_RADIOS = [
  {
    nombre: 'Radio Corazón',
    slug: 'radio-corazon',
    region: 'Metropolitana',
    ciudad: 'Santiago',
    logo_url: 'https://www.corazon.cl/wp-content/themes/prisa-corazon/assets/img/logo-corazon.png',
    sitio_web: 'https://www.corazon.cl',
    stream_url: 'https://18403.live.streamtheworld.com/CORAZONAAC.aac',
    metadata_url: 'CORAZON', // Usamos el código de estación como metadata_url para StreamTheWorld
    provider_name: 'StreamTheWorld',
    bitrate: 128,
    formato: 'aac',
    activo: true
  },
  {
    nombre: 'Radio Carolina',
    slug: 'radio-carolina',
    region: 'Metropolitana',
    ciudad: 'Santiago',
    logo_url: 'https://www.carolina.cl/wp-content/themes/prisa-carolina/assets/img/logo-carolina.png',
    sitio_web: 'https://www.carolina.cl',
    stream_url: 'https://26503.live.streamtheworld.com/CAROLINAAAC.aac',
    metadata_url: 'CAROLINA',
    provider_name: 'StreamTheWorld',
    bitrate: 128,
    formato: 'aac',
    activo: true
  },
  {
    nombre: 'Radio Activa',
    slug: 'radio-activa',
    region: 'Metropolitana',
    ciudad: 'Santiago',
    logo_url: 'https://www.radioactiva.cl/wp-content/themes/prisa-radioactiva/assets/img/logo-radioactiva.png',
    sitio_web: 'https://www.radioactiva.cl',
    stream_url: 'https://20853.live.streamtheworld.com/ACTIVAAAC.aac',
    metadata_url: 'ACTIVA',
    provider_name: 'StreamTheWorld',
    bitrate: 128,
    formato: 'aac',
    activo: true
  },
  {
    nombre: 'Radio FMDos',
    slug: 'radio-fmdos',
    region: 'Metropolitana',
    ciudad: 'Santiago',
    logo_url: 'https://www.fmdos.cl/wp-content/themes/prisa-fmdos/assets/img/logo-fmdos.png',
    sitio_web: 'https://www.fmdos.cl',
    stream_url: 'https://27153.live.streamtheworld.com/FMDOSAAC.aac',
    metadata_url: 'FMDOS',
    provider_name: 'StreamTheWorld',
    bitrate: 128,
    formato: 'aac',
    activo: true
  },
  {
    nombre: 'Radio Bío-Bío Santiago',
    slug: 'radio-bio-bio-santiago',
    region: 'Metropolitana',
    ciudad: 'Santiago',
    logo_url: 'https://www.biobiochile.cl/assets/img/logo-biobiochile.png',
    sitio_web: 'https://www.biobiochile.cl',
    stream_url: 'https://stream.biobiochile.cl/live',
    metadata_url: null,
    provider_name: 'Icecast',
    bitrate: 128,
    formato: 'mp3',
    activo: true
  },
  {
    nombre: 'Radio Cooperativa',
    slug: 'radio-cooperativa',
    region: 'Metropolitana',
    ciudad: 'Santiago',
    logo_url: 'https://www.cooperativa.cl/noticias/site/artic/20201103/imag/foto_0000000120201103120152.jpg',
    sitio_web: 'https://www.cooperativa.cl',
    stream_url: 'https://stream.cooperativa.cl/live',
    metadata_url: null,
    provider_name: 'Icecast',
    bitrate: 128,
    formato: 'mp3',
    activo: true
  }
];

async function seedRadios() {
  console.log('Iniciando carga de catálogo de radios...');

  // 1. Obtener los proveedores existentes para mapear sus IDs
  const { data: providers, error: providersError } = await supabase
    .from('radio_providers')
    .select('*');

  if (providersError) {
    console.error('Error al obtener proveedores:', providersError);
    process.exit(1);
  }

  const providerMap = new Map(providers.map(p => [p.nombre, p.id]));
  console.log(`Proveedores cargados: ${providers.length}`);

  let insertCount = 0;
  let updateCount = 0;

  for (const radio of INITIAL_RADIOS) {
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

    // Consultamos si la radio ya existe mediante el slug único
    const { data: existing, error: queryError } = await supabase
      .from('radios')
      .select('id')
      .eq('slug', radio.slug)
      .maybeSingle();

    if (queryError) {
      console.error(`Error al consultar radio "${radio.nombre}":`, queryError);
      continue;
    }

    if (existing) {
      // Si ya existe, actualizamos la información
      const { error: updateError } = await supabase
        .from('radios')
        .update(finalRadio)
        .eq('id', existing.id);

      if (updateError) {
        console.error(`Error al actualizar radio "${radio.nombre}":`, updateError);
      } else {
        updateCount++;
      }
    } else {
      // Si no existe, la insertamos
      const { error: insertError } = await supabase
        .from('radios')
        .insert(finalRadio);

      if (insertError) {
        console.error(`Error al insertar radio "${radio.nombre}":`, insertError);
      } else {
        insertCount++;
      }
    }
  }

  console.log(`Carga finalizada. Registradas: ${insertCount} nuevas. Actualizadas: ${updateCount}.`);
}

seedRadios();
