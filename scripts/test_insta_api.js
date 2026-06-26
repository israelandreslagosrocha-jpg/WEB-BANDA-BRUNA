async function test() {
  const url = 'https://www.instagram.com/banda_bruna/?__a=1&__d=dis';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    if (res.status === 200) {
      try {
        const json = JSON.parse(text);
        console.log("Followers:", json.graphql?.user?.edge_followed_by?.count || json.user?.edge_followed_by?.count);
      } catch (err) {
        console.log("Not JSON, starts with:", text.substring(0, 500));
      }
    } else {
      console.log("Response starts with:", text.substring(0, 500));
    }
  } catch (err) {
    console.error(err);
  }
}
test();
