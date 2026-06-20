import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statsFilePath = path.join(__dirname, '..', 'src', 'data', 'socialStats.json');

// Read existing stats
let stats = {
  musiciansTrajectory: 15,
  stageYears: 10,
  instagramFollowers: 3157,
  facebookFriends: 4900,
  youtubeSubscribers: 576,
  tiktokFollowers: 1092,
  regions: 5,
  lastUpdated: new Date().toISOString()
};

if (fs.existsSync(statsFilePath)) {
  try {
    const rawData = fs.readFileSync(statsFilePath, 'utf8');
    stats = { ...stats, ...JSON.parse(rawData) };
    console.log('Read existing stats:', stats);
  } catch (err) {
    console.warn('Could not read existing stats file, using defaults:', err.message);
  }
}

async function fetchYouTube() {
  try {
    const url = 'https://www.youtube.com/@bandabrunaoficial';
    console.log('Verifying YouTube subscribers...');
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    
    if (res.status === 200) {
      const html = await res.text();
      // Look for "content":"576 suscriptores" or similar in YouTube JSON
      const match = html.match(/"content"\s*:\s*"([\d,.]+)\s+(?:suscriptores|subscribers)"/i) ||
                    html.match(/"accessibilityLabel"\s*:\s*"([\d,.]+)\s+(?:suscriptores|subscribers)"/i);
      
      if (match) {
        // Strip out dots or commas and parse to integer
        const cleanVal = match[1].replace(/[.,]/g, '').trim();
        const count = parseInt(cleanVal, 10);
        if (!isNaN(count) && count > 0) {
          console.log(`YouTube subscriber count updated: ${count}`);
          stats.youtubeSubscribers = count;
          return;
        }
      }
      console.warn('YouTube response was OK but could not parse subscriber count pattern from HTML.');
    } else {
      console.warn(`YouTube fetch returned status: ${res.status}`);
    }
  } catch (err) {
    console.error('YouTube verification failed:', err.message);
  }
}

async function fetchTikTok() {
  try {
    const url = 'https://www.tiktok.com/@bandabrunaoficial';
    console.log('Verifying TikTok followers...');
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    
    if (res.status === 200) {
      const html = await res.text();
      const match = html.match(/"followerCount":\s*(\d+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        if (!isNaN(count) && count > 0) {
          console.log(`TikTok follower count updated: ${count}`);
          stats.tiktokFollowers = count;
          return;
        }
      }
      console.warn('TikTok response was OK but could not parse followerCount from HTML.');
    } else {
      console.warn(`TikTok fetch returned status: ${res.status}`);
    }
  } catch (err) {
    console.error('TikTok verification failed:', err.message);
  }
}

async function run() {
  // Run verifications in parallel
  await Promise.all([
    fetchYouTube(),
    fetchTikTok()
  ]);

  // Update timestamp
  stats.lastUpdated = new Date().toISOString();

  // Write back to JSON file
  try {
    // Ensure dir exists
    const dir = path.dirname(statsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf8');
    console.log('Saved updated stats to JSON:', stats);
  } catch (err) {
    console.error('Failed to save stats to file:', err.message);
  }
}

run();
