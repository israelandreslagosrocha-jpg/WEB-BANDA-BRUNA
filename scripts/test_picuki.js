async function test() {
  const url = 'https://www.picuki.com/profile/bandabruna_oficial';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("Length:", html.length);
    const match = html.match(/class="profile-info-number">([\d,.]+)/i);
    console.log("Match:", match);
    if (!match) {
      const idx = html.toLowerCase().indexOf('followed-by');
      const idx2 = html.toLowerCase().indexOf('follower');
      console.log("Indices:", idx, idx2);
      if (idx2 !== -1) {
        console.log("Around follower:", html.substring(idx2 - 150, idx2 + 150));
      }
    }
  } catch (err) {
    console.error(err);
  }
}
test();
