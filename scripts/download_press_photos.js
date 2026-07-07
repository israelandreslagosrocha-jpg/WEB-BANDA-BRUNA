import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const prensaDir = path.join(projectRoot, 'public', 'assets', 'images', 'prensa');
const instagramDir = path.join(projectRoot, 'public', 'assets', 'images', 'instagram');

// Definición de las descargas requeridas
const downloads = [
  // Fotos de Prensa (EPK)
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398590/compressed_BB29_ncdsn8.webp',
    dest: path.join(prensaDir, 'foto_prensa_1.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398587/compressed_BB23_exerbq.webp',
    dest: path.join(prensaDir, 'foto_prensa_2.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398587/compressed_BB24_sc1nby.webp',
    dest: path.join(prensaDir, 'foto_prensa_3.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398588/compressed_BB25_wokto3.webp',
    dest: path.join(prensaDir, 'foto_prensa_4.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398589/compressed_BB26_cou4ly.webp',
    dest: path.join(prensaDir, 'foto_prensa_5.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398590/compressed_BB28_eykyvc.webp',
    dest: path.join(prensaDir, 'foto_prensa_6.webp')
  },

  // Fotos de Redes Sociales (Instagram / Facebook Mock Feed)
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398590/compressed_BB29_ncdsn8.webp',
    dest: path.join(instagramDir, 'lanzamiento_reel.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398589/compressed_BB26_cou4ly.webp',
    dest: path.join(instagramDir, 'ig_reel_2.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398590/compressed_BB28_eykyvc.webp',
    dest: path.join(instagramDir, 'tercera_publicacion.webp')
  },
  {
    url: 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783398588/compressed_BB25_wokto3.webp',
    dest: path.join(instagramDir, 'segunda_publicacion.webp')
  }
];

// Asegurar directorios
if (!fs.existsSync(prensaDir)) {
  fs.mkdirSync(prensaDir, { recursive: true });
}
if (!fs.existsSync(instagramDir)) {
  fs.mkdirSync(instagramDir, { recursive: true });
}

async function downloadFile(url, destPath) {
  try {
    console.log(`Descargando: ${url} -> ${path.basename(destPath)}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log(`Guardado con éxito: ${destPath} (${buffer.length} bytes)`);
  } catch (err) {
    console.error(`Error al descargar ${url}:`, err.message);
  }
}

async function run() {
  console.log('Iniciando descarga de imágenes de Cloudinary...');
  for (const item of downloads) {
    await downloadFile(item.url, item.dest);
  }
  console.log('¡Descarga de imágenes completada!');
}

run();
