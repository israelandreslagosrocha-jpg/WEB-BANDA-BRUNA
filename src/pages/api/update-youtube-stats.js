export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get('id') || 'mZhYl60ENAs';
  const slug = url.searchParams.get('slug') || '';
  const isAhogado = slug === 'ahogado-en-un-bar' || videoId === 'mZhYl60ENAs';
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let views = isAhogado ? 26249 : 0;
  let likes = isAhogado ? 239 : 0;
  let fetchedLive = false;

  if (videoId) {
    try {
      const res = await fetch(youtubeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
        }
      });

      if (res.ok) {
        const html = await res.text();
        const viewMatch = html.match(/"viewCount":"(\d+)"/);
        const likeMatch = html.match(/"likeCount":"(\d+)"/);

        if (viewMatch && parseInt(viewMatch[1], 10) > 0) {
          views = parseInt(viewMatch[1], 10);
          fetchedLive = true;
        }
        if (likeMatch && parseInt(likeMatch[1], 10) > 0) {
          likes = parseInt(likeMatch[1], 10);
          fetchedLive = true;
        }
      }
    } catch (err) {
      // Si falla YouTube, retornamos los valores base
    }
  }

  return new Response(JSON.stringify({
    success: true,
    slug: slug || (isAhogado ? 'ahogado-en-un-bar' : ''),
    videoId,
    views,
    likes,
    fetchedLive,
    updated_at: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
    }
  });
}

