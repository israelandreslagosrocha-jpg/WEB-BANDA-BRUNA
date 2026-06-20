import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'instagram');

const reels = [
  {
    id: 'DZkqDn1uNpC',
    imageUrl: 'https://scontent.cdninstagram.com/v/t51.71878-15/722753485_1332500764933973_7569656927182138739_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=KS-okwmobHsQ7kNvwFxrryY&_nc_oc=Adqs_1nagIOO7AAG10bHBtBgOzdg6HxahN7Qp2VQU_Y7frGABmwqs217ouCKcjQqZkbC7NbmmRknzD068wUer-hm&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=DNXXgpa0NL1IV6SKLOg3cw&_nc_ss=7f689&oh=00_Af8gLG-L6DPWszDKNnEApQMa6DbvlIqIDZ3I5JXMcH6AIQ&oe=6A3BCE55',
    filename: 'ig_reel_1.webp'
  },
  {
    id: 'DGXG1nYse3g',
    imageUrl: 'https://scontent.cdninstagram.com/v/t51.71878-15/481190128_954854450085086_1149737544408432688_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=100&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=XfakK8q0JUcQ7kNvwHhmo69&_nc_oc=AdqViIRZ3JH-zgROW2JqmF1_uTeAv7AYeL5cnU9sViSEcOGp4lGWgqehseAPLrAsIgr2pgU4dd__FStS-39diZNx&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=Mslo9oOktmMCPnciNtnz-g&_nc_ss=7f689&oh=00_Af_X3ilAH4ChHzjP5H6iYxcTUtE-C8m_E6ng39lS858kVA&oe=6A3BD933',
    filename: 'ig_reel_2.webp'
  },
  {
    id: 'DZpvNd-uBjx',
    imageUrl: 'https://scontent.cdninstagram.com/v/t51.71878-15/719482934_1918599528848284_1880087251564324316_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=5fOt1Q1eoOkQ7kNvwHQIfeE&_nc_oc=AdrxJxNBn2lWLQHQf-DUTDsIX2Ahw89LmiALt-563425lGtKg9Q4LQnCaQOovwR_h9MPcNnozFUH6hUeW-Yq4saS&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=YivDPquK9zcWhedJDg9V3Q&_nc_ss=7f689&oh=00_Af-_Mf2CJBxlLwvYyoDNtaTu9Ap6LuB4zHnNfnhARMo8EA&oe=6A3BD0A6',
    filename: 'ig_reel_3.webp'
  },
  {
    id: 'DZlukv6MFPb',
    imageUrl: 'https://scontent.cdninstagram.com/v/t51.82787-15/724024573_18597292525046136_5190514317089080439_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=102&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=93_DzopTHysQ7kNvwGz2gS_&_nc_oc=AdoODwrOI_O-noGEQ4wBca86DWjDdq9IKPCJJ5i7t1baMCJjwsgtyR3CbuR5lozXRvRq3Ml1Va7GD93pTM7m_SJC&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=qWe_bN0YVaRW_eYxXd5aCg&_nc_ss=7f689&oh=00_Af-zq2iVzvUU80FdYUR_Q0tCNy3DQO7jKNsfft36PqyS_Q&oe=6A3BFBC3',
    filename: 'ig_reel_4.webp'
  },
  {
    id: 'DYQjaW4p6zw',
    imageUrl: 'https://scontent.cdninstagram.com/v/t51.71878-15/691480073_1558724689147678_5931702772484985791_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=106&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=Zvfy79BAgW0Q7kNvwFAruXd&_nc_oc=AdoZgtH3DwTroT0BZrTzFgQGFhxJv1On0xAaF4SPqvkp82jy-jvDPjBtwUAfqIIVtk8IL_ILvrHqtMV8aPn5KXl2&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=InsTGVRa3gJgVsl7WJuXgQ&_nc_ss=7f689&oh=00_Af98N6DJq-AbmmWzdaXc29cl_NhwJenCExlENUI-oovehg&oe=6A3BD5D4',
    filename: 'ig_reel_5.webp'
  }
];

async function run() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created directory:', targetDir);
  }

  for (const reel of reels) {
    try {
      console.log(`Downloading Instagram Reel cover for ID: ${reel.id}...`);
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
