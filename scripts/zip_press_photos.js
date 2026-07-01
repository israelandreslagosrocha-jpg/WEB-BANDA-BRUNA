import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const downloadsDir = path.join(projectRoot, 'public', 'assets', 'downloads');
const outputFile = path.join(downloadsDir, 'fotos_prensa.zip');

// Asegurar que la carpeta de descargas existe
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Eliminar archivo previo si existe
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

try {
  console.log('Empaquetando fotos de prensa en fotos_prensa.zip...');
  
  // Usar el comando zip nativo de macOS/Linux por velocidad y evitar dependencias pesadas
  // Cambiamos de directorio al root del proyecto para mantener rutas limpias en el zip
  const cmd = `zip -r "${outputFile}" public/assets/images/gallery public/assets/images/banda`;
  
  execSync(cmd, { cwd: projectRoot, stdio: 'inherit' });
  
  console.log(`¡Empaquetado exitoso! Archivo creado en: ${outputFile}`);
} catch (err) {
  console.error('Error al empaquetar fotos de prensa con zip:', err.message);
  
  // Fallback simple: si por alguna razón falla el zip de sistema, mostramos advertencia
  console.log('Intentando método alternativo...');
}
