async function test() {
  const url = 'https://urlebird.com/user/bandabrunaoficial/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("Length:", html.length);
    // Search for followers in Urlebird HTML
    // Normally it contains something like "Followers: 1.1k" or similar
    const match = html.match(/followers">([\s\S]*?)<\/div>/i) ||
                  html.match(/followers\s*:\s*([\d,.]+k?)/i) ||
                  html.match(/([\d,.]+k?)\s+followers/i) ||
                  html.match(/div class="info-user">[\s\S]*?<\/div>/i);
    console.log("Match:", match);
    if (!match) {
      const idx = html.toLowerCase().indexOf('follower');
      if (idx !== -1) {
        console.log("Around follower:", html.substring(idx - 100, idx + 100));
      }
    }
  } catch (err) {
    console.error(err);
  }
}
test();
