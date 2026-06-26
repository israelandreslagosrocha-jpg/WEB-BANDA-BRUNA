import fs from 'fs';
async function test() {
  const url = 'https://www.google.com/search?q=site:instagram.com/banda_bruna';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    const html = await res.text();
    fs.writeFileSync('scripts/google_search.html', html);
    console.log("Saved HTML to scripts/google_search.html");
    
    // Search for keywords
    const keywords = ['seguidores', 'followers', '3190', '3.190', '3,190', 'banda_bruna'];
    keywords.forEach(kw => {
      const idx = html.toLowerCase().indexOf(kw.toLowerCase());
      console.log(`Keyword '${kw}' index:`, idx);
      if (idx !== -1) {
        console.log(`Context for '${kw}':`, html.substring(idx - 50, idx + 150));
      }
    });
  } catch (err) {
    console.error(err);
  }
}
test();
