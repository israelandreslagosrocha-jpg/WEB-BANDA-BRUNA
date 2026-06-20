import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tiktokDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'tiktok');

async function convertToWebp() {
  for (let i = 1; i <= 5; i++) {
    try {
      const jpgPath = path.join(tiktokDir, `tiktok_${i}.jpg`);
      const webpPath = path.join(tiktokDir, `tiktok_${i}.webp`);
      
      if (fs.existsSync(jpgPath)) {
        console.log(`Converting tiktok_${i}.jpg to webp...`);
        await sharp(jpgPath)
          .webp({ quality: 85 })
          .toFile(webpPath);
        
        console.log(`Saved: ${webpPath}`);
        // Delete original JPG
        fs.unlinkSync(jpgPath);
      }
    } catch (err) {
      console.error(`Error converting image ${i}:`, err.message);
    }
  }
}

convertToWebp();
