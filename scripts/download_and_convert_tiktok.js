import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'tiktok');

const videos = [
  {
    id: '7552604759543270667',
    thumbnailUrl: 'https://p16-common-sign.tiktokcdn.com/tos-maliva-p-0068/os3aBf6ZCirkIgPGzB0oiA5QEHIBAcjCbgrJPQ~tplv-tiktokx-origin.image?dr=14575&x-expires=1782100800&x-signature=bpKMP5D5GOF5olOk2evee18YwKs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my',
    filename: 'tiktok_1.webp'
  },
  {
    id: '7328464244482034949',
    thumbnailUrl: 'https://p16-common-sign.tiktokcdn.com/tos-maliva-p-0068/001fc9d39be94efbb6916f809724fd2c_1706291052~tplv-tiktokx-origin.image?dr=14575&x-expires=1782100800&x-signature=iyskNMvFI8GM01rGgK%2BdtcBUvE8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my',
    filename: 'tiktok_2.webp'
  },
  {
    id: '7523401411820817669',
    thumbnailUrl: 'https://p16-common-sign.tiktokcdn.com/tos-maliva-p-0068/oMQIhLQ7PCCcCmGLgeJsySFgIeeVw0p54GkAj4~tplv-tiktokx-origin.image?dr=14575&x-expires=1782100800&x-signature=gZ%2FoDgI3RtTrr8puNmwcFk%2B2kKo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my',
    filename: 'tiktok_3.webp'
  },
  {
    id: '7651986871995600135',
    thumbnailUrl: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/okQjKYQxYoVevGMrCA86WSA4DLQfZf27DqYUUI~tplv-tiktokx-origin.image?dr=14575&x-expires=1782100800&x-signature=C2UMwLwHMKjRdGAUqXtS2TLylUM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my',
    filename: 'tiktok_4.webp'
  },
  {
    id: '7651491620336061714',
    thumbnailUrl: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-p-0037/oofhvOkABCBE4VgWpBDtcqQyLQewojRZ4F8EoD~tplv-tiktokx-origin.image?dr=14575&x-expires=1782100800&x-signature=Jwz%2B9v9o6joMRnjDeyMz0%2B57b4E%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my',
    filename: 'tiktok_5.webp'
  }
];

async function run() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created directory:', targetDir);
  }

  for (const video of videos) {
    try {
      console.log(`Downloading TikTok cover for ID: ${video.id}...`);
      const response = await fetch(video.thumbnailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const outputPath = path.join(targetDir, video.filename);
      await sharp(buffer)
        .webp({ quality: 85 })
        .toFile(outputPath);

      console.log(`Saved optimized WebP to: ${outputPath}, size: ${fs.statSync(outputPath).size} bytes`);
    } catch (err) {
      console.error(`Error downloading cover for ${video.id}:`, err.message);
    }
  }
}

run();
