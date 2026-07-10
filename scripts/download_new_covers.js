import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fbDest = path.join(__dirname, '..', 'public', 'assets', 'images', 'facebook', 'chicos_magicos.webp');
const ttDest = path.join(__dirname, '..', 'public', 'assets', 'images', 'tiktok', 'tiktok_nuevo.webp');

const fbUrl = 'https://scontent-iad6-1.xx.fbcdn.net/v/t15.5256-10/738937475_2085960655611305_5715608669033571508_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=a27664&_nc_ohc=nPqNuuUrB58Q7kNvwFD2Qna&_nc_oc=AdrWJ0ltYfsGKIwEH3BX5L1TNAUM2805v9aK5K5wUiUr1mugCyHzpXLHHSW_Ek2QwCg&_nc_zt=23&_nc_ht=scontent-iad6-1.xx&_nc_gid=6mRaZNWP-2O4hpw8HP9SLQ&_nc_ss=7b20f&oh=00_AQDeKgQBT-Cz3hz2hHbvIvBJzvbezghib8R3ggq_UVYFdg&oe=6A561667';
const ttUrl = 'https://www.tiktok.com/api/img/?itemId=7659638967054126354&location=0&aid=1988';

async function downloadAndConvert(url, dest) {
  try {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Asegurarse de que el directorio existe
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await sharp(buffer)
      .webp({ quality: 85 })
      .toFile(dest);

    console.log(`Saved optimized WebP to: ${dest}, size: ${fs.statSync(dest).size} bytes`);
  } catch (err) {
    console.error(`Error processing ${url}:`, err.message);
  }
}

async function main() {
  await downloadAndConvert(fbUrl, fbDest);
  await downloadAndConvert(ttUrl, ttDest);
}

main();
