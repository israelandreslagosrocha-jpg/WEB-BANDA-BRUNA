async function test() {
  const url = 'https://imginn.com/bandabruna_oficial/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("Length:", html.length);
    // Search for followers pattern
    // Usually it has something like "followers" or "Followers" near a number.
    // Let's search for "followers" in the text
    const match = html.match(/([\d,.]+k?)\s*<\/span>\s*followers/i) || 
                  html.match(/followers\s*:\s*([\d,.]+)/i) ||
                  html.match(/"followers":\s*(\d+)/i) ||
                  html.match(/([\d,.]+)\s+Followers/i);
    console.log("Match:", match);
    if (!match) {
      // Print a slice around the word "follower"
      const idx = html.toLowerCase().indexOf('follower');
      if (idx !== -1) {
        console.log("Around follower:", html.substring(idx - 100, idx + 100));
      } else {
        console.log("Word 'follower' not found.");
      }
    }
  } catch (err) {
    console.error(err);
  }
}
test();
