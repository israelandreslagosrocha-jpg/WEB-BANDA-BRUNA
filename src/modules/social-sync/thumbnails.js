import { getVideoPlaylists, getInstagramFeed, getFacebookFeed } from '../../services/socialApi.js';

const genericCover = '/assets/images/hero/hero_1.webp';
function postKey(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    // Instagram uses both /p/ and /reel/ for the same publication.
    const path = url.pathname.replace(/\/$/, '').replace(/^\/[^/]+\/reel\//, '/p/').replace(/^\/reel\//, '/p/');
    return host + path;
  } catch { return ''; }
}
const saved = new Map();
for (const item of [...Object.values(getVideoPlaylists()).flat(), ...getInstagramFeed(), ...getFacebookFeed()]) {
  const image = item.thumbnail || item.imageUrl;
  if (image?.startsWith('/assets/images/')) saved.set(postKey(item.url || item.link), image);
}
for (const [url, image] of [
  ['https://www.instagram.com/p/DdiCbjguqh5/', 'instagram-DdiCbjguqh5.webp'],
  ['https://www.facebook.com/reel/2142030620083740', 'facebook-2142030620083740.webp'],
  ['https://www.tiktok.com/@bandabrunaoficial/video/7687805684464831752', 'tiktok-7687805684464831752.webp']
]) saved.set(postKey(url), '/assets/images/social/' + image);

export function socialThumbnail(post) {
  const image = saved.get(postKey(post.post_url || post.url)) || post.thumbnail_url;
  const src = typeof image === 'string' && (image.startsWith('/assets/images/') || image.startsWith('https://')) ? image : genericCover;
  return { src, fallback: genericCover, generic: src === genericCover };
}
