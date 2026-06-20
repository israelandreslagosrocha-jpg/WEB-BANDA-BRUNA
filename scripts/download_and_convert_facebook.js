import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'facebook');

const reels = [
  {
    id: '1020112310713480',
    imageUrl: 'https://scontent.fccp1-1.fna.fbcdn.net/v/t15.5256-10/725474554_1948410792509966_1002901274603717905_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=a27664&_nc_ohc=nILQ5_PRqfAQ7kNvwHwWUgH&_nc_oc=AdoKL3pfoBhnD1QVhsCcAB3Hy80ky259AECNWzCMdXPHSYY2EAKYekUHsMlE49plTQtAAr_YmYBsnoqMN-cjqhkp&_nc_zt=23&_nc_ht=scontent.fccp1-1.fna&_nc_gid=HllkuXsYa5GcdrBMySw9qA&_nc_ss=7f289&oh=00_Af9ETuM08JTrg5L5cRFSbbepFnmOv9CqtvvWnE6OD-NaeQ&oe=6A3BDF81',
    filename: 'fb_reel_1.webp'
  },
  {
    id: '1703217417670134',
    imageUrl: 'https://scontent.fccp1-1.fna.fbcdn.net/v/t15.5256-10/726399706_2003540113613598_1045029286699726960_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=a27664&_nc_ohc=yl4e9gs-pmIQ7kNvwEwp5U1&_nc_oc=AdrNzLpFjzsgYli_pcV3_qNX3gC8qjDm-SQzL9_RHEI6TRqmOx5Cdwh6cmPA5LS1h18qy2i4DKkHBGdg0Ieif48c&_nc_zt=23&_nc_ht=scontent.fccp1-1.fna&_nc_gid=QaWMLLTbWzBT3FwLQVtqAA&_nc_ss=7f289&oh=00_Af9H4UjOZb4ZHdB8fOfwzMusuIjK0RLyosRtGiJoEaGj9A&oe=6A3BFBC3',
    filename: 'fb_reel_2.webp'
  },
  {
    id: '1322360210101084',
    imageUrl: 'https://scontent.fccp1-1.fna.fbcdn.net/v/t15.5256-10/724484723_1406220111525639_3729433540387323905_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a27664&_nc_ohc=IMt2Geo0hGwQ7kNvwG2ZMem&_nc_oc=AdqDi6V-HYzOcyQpQ8fZ6eDkrGveMp_03zAXrzZIyjk5zMSOogiHCoFS8QbYZaPaQaqW8Xr6WA5a1wmy1-BQKKLQ&_nc_zt=23&_nc_ht=scontent.fccp1-1.fna&_nc_gid=9zIdluaUGOLgAoLI4mDbqw&_nc_ss=7f289&oh=00_Af97pyJJ5HndqR9ZBJuj0gJjKa_6xmi16DVSSid8m3yUCQ&oe=6A3BF782',
    filename: 'fb_reel_3.webp'
  },
  {
    id: '1714825649530208',
    imageUrl: 'https://scontent.fccp1-1.fna.fbcdn.net/v/t15.5256-10/702009743_806734682316833_5666027963184169833_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=a27664&_nc_ohc=pClDyhGjyZMQ7kNvwHTZb9t&_nc_oc=AdpsP5uR5qAwR_zXxaKHsm15jnWpJnHZXZHOKOO0i-EcIhE-DUdg3UwFC_Lo2q8q8fiwUzleztzR0D88P7XI9lCx&_nc_zt=23&_nc_ht=scontent.fccp1-1.fna&_nc_gid=WPadrSdu5np-sumI7nuClA&_nc_ss=7f289&oh=00_Af9SV8_GjG6IyJDaxRu-3m9fsKEW4Ipsor7A_eejI89a2w&oe=6A3C00BA',
    filename: 'fb_reel_4.webp'
  },
  {
    id: '986876017068292',
    imageUrl: 'https://scontent.fccp1-1.fna.fbcdn.net/v/t15.5256-10/687387136_820912591091991_1488575706820394838_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=a27664&_nc_ohc=lpXPk_lgFnQQ7kNvwEZfGRT&_nc_oc=Adq8h8xTZWiIqvFRtWo9xeC7M5HKZWCRnrrSaJOU-ZFvcwHaHwFByLfVRv-Nbwz2j-NSFK8fbyjksqnAYva9YfwO&_nc_zt=23&_nc_ht=scontent.fccp1-1.fna&_nc_gid=ZXd8T5oGYWUSWw0xt7JEvw&_nc_ss=7f289&oh=00_Af9azJDrtcx09FEEAPLrqBKLGCg2194ur5mRPffvHut8yQ&oe=6A3BEAB3',
    filename: 'fb_reel_5.webp'
  }
];

async function run() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created directory:', targetDir);
  }

  for (const reel of reels) {
    try {
      console.log(`Downloading Facebook Reel cover for ID: ${reel.id}...`);
      const response = await fetch(reel.imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const outputPath = path.join(targetDir, reel.filename);
      await sharp(buffer)
        .webp({ quality: 85 })
        .toFile(outputPath);

      console.log(`Saved optimized WebP to: ${outputPath}, size: ${fs.statSync(outputPath).size} bytes`);
    } catch (err) {
      console.error(`Error downloading cover for ${reel.id}:`, err.message);
    }
  }
}

run();
